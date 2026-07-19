import 'server-only'
import { Prisma } from '../../../../prisma/generated/client'
import { prisma } from '@/lib/prisma'
import { getValidLoyverseAccessToken } from './connection'
import { fetchReceiptsPage, type LoyverseReceipt } from './client'

// ─── Phase 3B: receipt pull sync ─────────────────────────────────────
// Real-time "autosave" would ideally be push-based (a Loyverse webhook
// firing the moment a POS receipt is created), but the exact webhook
// payload shape and signature-verification scheme are not confirmed from
// the live Loyverse docs at implementation time. Per the "don't invent
// endpoints/fields/webhook capabilities" rule, this phase implements only
// the fully-documented pull path: `GET /v1.0/receipts`, polled on an
// interval (see scheduler.ts) plus an on-demand "Sync Now" action.
//
// Idempotency: `Invoice` has a unique (branchId, loyverseReceiptNumber)
// constraint, and every sync run upserts on that key — running the same
// window twice, or overlapping with the scheduler, can never create a
// duplicate Invoice for the same Loyverse receipt.

const RECEIPTS_PAGE_LIMIT = 250
// Small negative offset applied to the "since" watermark so a receipt
// updated in the last few seconds of a run (and thus possibly missed by
// an exact-boundary `updated_at_min`) gets picked up again next run. Since
// upserts are idempotent this costs nothing but a harmless re-write.
const WATERMARK_SAFETY_MS = 60_000

export interface SyncSummary {
  branchId: string
  fetched: number
  created: number
  updated: number
  failed: number
  error?: string
}

function toDecimalInput(value: number | undefined | null): number {
  return value ?? 0
}

function resolveItemName(lineItem: LoyverseReceipt['line_items'][number]): string {
  return lineItem.item_name?.trim() || lineItem.variant_name?.trim() || lineItem.sku?.trim() || 'Item'
}

function resolveLineTotal(lineItem: LoyverseReceipt['line_items'][number]): number {
  if (typeof lineItem.total_money === 'number') return lineItem.total_money
  if (typeof lineItem.gross_total_money === 'number') return lineItem.gross_total_money
  return lineItem.price * lineItem.quantity
}

async function upsertReceipt(
  branchId: string,
  storeId: string,
  receipt: LoyverseReceipt,
  actorId: string,
): Promise<'created' | 'updated' | 'failed'> {
  try {
    const totalPaid = receipt.payments.reduce((sum, payment) => sum + (payment.money_amount ?? 0), 0)

    const existing = await prisma.invoice.findUnique({
      where: {
        branchId_loyverseReceiptNumber: {
          branchId,
          loyverseReceiptNumber: receipt.receipt_number,
        },
      },
      select: { id: true },
    })

    const baseData = {
      branchId,
      loyverseReceiptNumber: receipt.receipt_number,
      loyverseStoreId: storeId,
      loyverseOrder: receipt.order ?? null,
      loyversePosDeviceId: receipt.pos_device_id ?? null,
      loyverseEmployeeId: receipt.employee_id ?? null,
      loyverseCustomerId: receipt.customer_id ?? null,
      receiptType: receipt.receipt_type ?? 'SALE',
      refundFor: receipt.refund_for ?? null,
      receiptDate: new Date(receipt.receipt_date),
      totalMoney: toDecimalInput(receipt.total_money),
      totalTax: toDecimalInput(receipt.total_tax),
      totalDiscount: toDecimalInput(receipt.total_discount),
      totalPaid: toDecimalInput(totalPaid),
      cancelled: Boolean(receipt.cancelled_at),
      syncStatus: 'SYNCED' as const,
      lastSyncedAt: new Date(),
      lastSyncError: null,
      rawPayload: receipt as unknown as Prisma.InputJsonValue,
      updatedBy: actorId,
    }

    await prisma.$transaction(async tx => {
      const invoice = existing
        ? await tx.invoice.update({ where: { id: existing.id }, data: baseData })
        : await tx.invoice.create({ data: { ...baseData, createdBy: actorId } })

      // Line items and payments are always fully replaced on re-sync —
      // Loyverse receipts are immutable once created, so this only
      // actually changes anything the first time a receipt is seen.
      await tx.invoiceLineItem.deleteMany({ where: { invoiceId: invoice.id } })
      await tx.invoicePayment.deleteMany({ where: { invoiceId: invoice.id } })

      if (receipt.line_items.length > 0) {
        await tx.invoiceLineItem.createMany({
          data: receipt.line_items.map(lineItem => ({
            invoiceId: invoice.id,
            loyverseLineItemId: lineItem.id ?? null,
            loyverseVariantId: lineItem.variant_id ?? null,
            itemName: resolveItemName(lineItem),
            sku: lineItem.sku ?? null,
            quantity: toDecimalInput(lineItem.quantity),
            price: toDecimalInput(lineItem.price),
            cost: lineItem.cost != null ? toDecimalInput(lineItem.cost) : null,
            lineNote: lineItem.line_note ?? null,
            grossTotal: toDecimalInput(resolveLineTotal(lineItem)),
          })),
        })
      }

      if (receipt.payments.length > 0) {
        await tx.invoicePayment.createMany({
          data: receipt.payments.map(payment => ({
            invoiceId: invoice.id,
            loyversePaymentTypeId: payment.payment_type_id ?? null,
            paymentTypeName: payment.name ?? null,
            moneyAmount: toDecimalInput(payment.money_amount),
            paidAt: payment.paid_at ? new Date(payment.paid_at) : null,
          })),
        })
      }
    })

    return existing ? 'updated' : 'created'
  } catch (error) {
    console.error(`[Loyverse] Failed to upsert receipt ${receipt.receipt_number}:`, error)
    return 'failed'
  }
}

/**
 * Syncs all receipts updated since the branch's last successful sync
 * watermark. Safe to call concurrently with itself (e.g. a manual "Sync
 * Now" click racing the scheduler) — worst case is redundant, idempotent
 * upserts of the same page.
 */
export async function syncReceiptsForBranch(branchId: string, actorId: string): Promise<SyncSummary> {
  const summary: SyncSummary = { branchId, fetched: 0, created: 0, updated: 0, failed: 0 }

  const connection = await prisma.loyverseConnection.findUnique({ where: { branchId } })

  if (!connection || connection.status !== 'CONNECTED' || !connection.storeId) {
    summary.error = 'Branch has no connected Loyverse store'
    return summary
  }

  const accessToken = await getValidLoyverseAccessToken(branchId)
  if (!accessToken) {
    summary.error = 'Could not obtain a valid Loyverse access token'
    await prisma.loyverseConnection.update({
      where: { branchId },
      data: { lastReceiptSyncError: summary.error },
    })
    return summary
  }

  const since = connection.lastReceiptSyncedAt
    ? new Date(connection.lastReceiptSyncedAt.getTime() - WATERMARK_SAFETY_MS)
    : undefined

  const runStartedAt = new Date()

  try {
    let cursor: string | undefined = undefined

    do {
      const page = await fetchReceiptsPage({
        accessToken,
        storeId: connection.storeId,
        updatedAtMin: since?.toISOString(),
        cursor,
        limit: RECEIPTS_PAGE_LIMIT,
      })

      summary.fetched += page.receipts.length

      for (const receipt of page.receipts) {
        const result = await upsertReceipt(branchId, connection.storeId, receipt, actorId)
        if (result === 'created') summary.created += 1
        else if (result === 'updated') summary.updated += 1
        else summary.failed += 1
      }

      cursor = page.cursor ?? undefined
    } while (cursor)

    await prisma.loyverseConnection.update({
      where: { branchId },
      data: { lastReceiptSyncedAt: runStartedAt, lastReceiptSyncError: null },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown sync error'
    summary.error = message
    console.error(`[Loyverse] Receipt sync failed for branch ${branchId}:`, error)
    await prisma.loyverseConnection.update({
      where: { branchId },
      data: { lastReceiptSyncError: message },
    })
  }

  return summary
}

/**
 * Syncs every CONNECTED branch. Used by the scheduler and the cron-secret
 * protected API route. Failures on one branch never block the others.
 */
export async function syncAllConnectedBranches(actorId = 'system:scheduler'): Promise<SyncSummary[]> {
  const connections = await prisma.loyverseConnection.findMany({
    where: { status: 'CONNECTED' },
    select: { branchId: true },
  })

  const summaries: SyncSummary[] = []
  for (const connection of connections) {
    summaries.push(await syncReceiptsForBranch(connection.branchId, actorId))
  }
  return summaries
}
