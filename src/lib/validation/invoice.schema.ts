import { z } from 'zod'

// Parses raw Next.js searchParams (string | string[] | undefined) into a
// typed, safe filter object. Every field is optional — an empty filter
// set means "everything for the active branch".
export const invoiceSearchParamsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().trim().max(100).optional(),
  paymentType: z.string().trim().max(100).optional(),
  receiptType: z.enum(['ALL', 'SALE', 'REFUND']).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
})

export type InvoiceSearchParams = z.infer<typeof invoiceSearchParamsSchema>

export interface InvoiceFilters {
  from?: Date
  to?: Date
  q?: string
  paymentType?: string
  receiptType?: 'ALL' | 'SALE' | 'REFUND'
  minAmount?: number
  maxAmount?: number
  page: number
}

export const INVOICES_PAGE_SIZE = 20

/**
 * Converts raw, validated search params into typed filters ready for a
 * Prisma `where` clause. Invalid dates are silently dropped rather than
 * throwing — a bad filter should degrade to "no filter", not a 500.
 */
export function toInvoiceFilters(params: InvoiceSearchParams): InvoiceFilters {
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  if (to) {
    // Treat "to" as inclusive of the whole day.
    to.setHours(23, 59, 59, 999)
  }

  return {
    from: from && !Number.isNaN(from.getTime()) ? from : undefined,
    to: to && !Number.isNaN(to.getTime()) ? to : undefined,
    q: params.q || undefined,
    paymentType: params.paymentType || undefined,
    receiptType: params.receiptType && params.receiptType !== 'ALL' ? params.receiptType : undefined,
    minAmount: params.minAmount,
    maxAmount: params.maxAmount,
    page: params.page ?? 1,
  }
}
