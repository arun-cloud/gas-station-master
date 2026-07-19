import 'server-only'
import { prisma } from '@/lib/prisma'
import { resolveActiveBranch } from '@/lib/branch-context'
import { INVOICES_PAGE_SIZE, type InvoiceFilters } from '@/lib/validation/invoice.schema'
import type { Prisma } from '../../../prisma/generated/client'

export type InvoiceListItem = {
  id: string
  loyverseReceiptNumber: string
  receiptType: string
  receiptDate: string
  totalMoney: string
  totalPaid: string
  cancelled: boolean
  paymentSummary: string
}

export type InvoiceSearchResult = {
  invoices: InvoiceListItem[]
  total: number
  page: number
  pageSize: number
}

function buildWhere(branchId: string, filters: InvoiceFilters): Prisma.InvoiceWhereInput {
  const where: Prisma.InvoiceWhereInput = {
    branchId,
    isActive: true,
  }

  if (filters.from || filters.to) {
    where.receiptDate = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    }
  }

  if (filters.receiptType) {
    where.receiptType = filters.receiptType
  }

  if (filters.minAmount != null || filters.maxAmount != null) {
    where.totalMoney = {
      ...(filters.minAmount != null ? { gte: filters.minAmount } : {}),
      ...(filters.maxAmount != null ? { lte: filters.maxAmount } : {}),
    }
  }

  if (filters.q) {
    where.OR = [
      { loyverseReceiptNumber: { contains: filters.q, mode: 'insensitive' } },
      { loyverseOrder: { contains: filters.q, mode: 'insensitive' } },
    ]
  }

  if (filters.paymentType) {
    where.payments = {
      some: { paymentTypeName: { contains: filters.paymentType, mode: 'insensitive' } },
    }
  }

  return where
}

/**
 * Searches invoices for the active branch. Read-only, branch-scoped via
 * resolveActiveBranch (never trusts a branchId from client input).
 */
export async function searchInvoices(filters: InvoiceFilters): Promise<InvoiceSearchResult> {
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return { invoices: [], total: 0, page: filters.page, pageSize: INVOICES_PAGE_SIZE }
  }

  const where = buildWhere(activeBranch.id, filters)
  const skip = (filters.page - 1) * INVOICES_PAGE_SIZE

  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include: { payments: true },
      orderBy: { receiptDate: 'desc' },
      skip,
      take: INVOICES_PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ])

  return {
    invoices: rows.map(invoice => ({
      id: invoice.id,
      loyverseReceiptNumber: invoice.loyverseReceiptNumber,
      receiptType: invoice.receiptType,
      receiptDate: invoice.receiptDate.toISOString(),
      totalMoney: invoice.totalMoney.toFixed(2),
      totalPaid: invoice.totalPaid.toFixed(2),
      cancelled: invoice.cancelled,
      paymentSummary:
        invoice.payments.map(payment => payment.paymentTypeName).filter(Boolean).join(', ') || '—',
    })),
    total,
    page: filters.page,
    pageSize: INVOICES_PAGE_SIZE,
  }
}

export type InvoiceDetail = {
  id: string
  loyverseReceiptNumber: string
  receiptType: string
  refundFor: string | null
  receiptDate: string
  currency: string
  totalMoney: string
  totalTax: string
  totalDiscount: string
  totalPaid: string
  cancelled: boolean
  lastSyncedAt: string
  branch: { nameEn: string; nameAr: string; branchCode: string }
  lineItems: Array<{
    id: string
    itemName: string
    lineNote: string | null
    quantity: string
    price: string
    grossTotal: string
  }>
  payments: Array<{ id: string; paymentTypeName: string | null; moneyAmount: string }>
}

/**
 * Fetches one invoice for the preview/detail screen, scoped to the active
 * branch so a user can never view another branch's invoice by guessing
 * an id. All Decimal/Date fields are converted to plain strings here so
 * the result is safe to pass to a Client Component if a future screen
 * needs to.
 */
export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  const { activeBranch } = await resolveActiveBranch()
  if (!activeBranch) return null

  const invoice = await prisma.invoice.findFirst({
    where: { id, branchId: activeBranch.id, isActive: true },
    include: {
      lineItems: { orderBy: { createdAt: 'asc' } },
      payments: { orderBy: { createdAt: 'asc' } },
      branch: { select: { nameEn: true, nameAr: true, branchCode: true } },
    },
  })

  if (!invoice) return null

  return {
    id: invoice.id,
    loyverseReceiptNumber: invoice.loyverseReceiptNumber,
    receiptType: invoice.receiptType,
    refundFor: invoice.refundFor,
    receiptDate: invoice.receiptDate.toISOString(),
    currency: invoice.currency,
    totalMoney: invoice.totalMoney.toFixed(2),
    totalTax: invoice.totalTax.toFixed(2),
    totalDiscount: invoice.totalDiscount.toFixed(2),
    totalPaid: invoice.totalPaid.toFixed(2),
    cancelled: invoice.cancelled,
    lastSyncedAt: invoice.lastSyncedAt.toISOString(),
    branch: invoice.branch,
    lineItems: invoice.lineItems.map(item => ({
      id: item.id,
      itemName: item.itemName,
      lineNote: item.lineNote,
      quantity: item.quantity.toString(),
      price: item.price.toFixed(2),
      grossTotal: item.grossTotal.toFixed(2),
    })),
    payments: invoice.payments.map(payment => ({
      id: payment.id,
      paymentTypeName: payment.paymentTypeName,
      moneyAmount: payment.moneyAmount.toFixed(2),
    })),
  }
}
