import { z } from 'zod'

export const selectLoyverseStoreSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  storeId: z.string().min(1, 'Please select a store'),
  storeName: z.string().min(1, 'Store name is required'),
})

export type SelectLoyverseStoreInput = z.infer<typeof selectLoyverseStoreSchema>

export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input'
}
