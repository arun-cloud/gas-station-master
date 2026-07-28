import { z } from 'zod'

export const supplierTypeSchema = z.enum([
  'FUEL',
  'PRODUCT',
  'SERVICE',
  'UTILITY',
  'GOVERNMENT',
  'OTHER',
])

const optionalTrimmed = (max: number) =>
  z.preprocess(
    value => {
      const normalized = String(value ?? '').trim()
      return normalized.length === 0 ? undefined : normalized
    },
    z.string().max(max).optional(),
  )

export const supplierInputSchema = z.object({
  supplierCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{2,30}$/, 'Supplier code must use letters, numbers or hyphens'),
  nameEn: z.string().trim().min(2).max(150),
  nameAr: optionalTrimmed(150),
  legalName: optionalTrimmed(200),
  type: supplierTypeSchema,
  vatNumber: z.preprocess(
    value => {
      const normalized = String(value ?? '').replace(/\s+/g, '')
      return normalized.length === 0 ? undefined : normalized
    },
    z.string().regex(/^\d{15}$/, 'VAT number must contain exactly 15 digits').optional(),
  ),
  crNumber: z.preprocess(
    value => {
      const normalized = String(value ?? '').replace(/\s+/g, '')
      return normalized.length === 0 ? undefined : normalized
    },
    z.string().regex(/^\d{10}$/, 'CR number must contain exactly 10 digits').optional(),
  ),
  contactName: optionalTrimmed(120),
  phone: optionalTrimmed(30),
  email: z.preprocess(
    value => {
      const normalized = String(value ?? '').trim().toLowerCase()
      return normalized.length === 0 ? undefined : normalized
    },
    z.string().email().max(150).optional(),
  ),
  address: optionalTrimmed(300),
  city: optionalTrimmed(100),
  paymentTermsDays: z.coerce.number().int().min(0).max(365),
  creditLimit: z.coerce.number().min(0).max(999_999_999.99),
  notes: optionalTrimmed(1000),
  branchIds: z.array(z.string().min(1)).min(1, 'Assign the supplier to at least one branch'),
})

export const supplierSearchParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  type: supplierTypeSchema.or(z.literal('ALL')).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().positive().optional(),
})

export type SupplierInput = z.infer<typeof supplierInputSchema>
export type SupplierTypeValue = z.infer<typeof supplierTypeSchema>
export type SupplierSearchParams = z.infer<typeof supplierSearchParamsSchema>

export type SupplierFilters = {
  q?: string
  type?: SupplierTypeValue
  isActive?: boolean
  page: number
}

export const SUPPLIERS_PAGE_SIZE = 20

export function toSupplierFilters(params: SupplierSearchParams): SupplierFilters {
  return {
    q: params.q || undefined,
    type: params.type && params.type !== 'ALL' ? params.type : undefined,
    isActive:
      params.status === 'ACTIVE' ? true : params.status === 'INACTIVE' ? false : undefined,
    page: params.page ?? 1,
  }
}
