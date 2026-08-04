import { z } from 'zod'

const optionalTrimmed = (maxLength: number) =>
  z.preprocess(
    value => {
      const normalized = String(value ?? '').trim()
      return normalized.length === 0 ? undefined : normalized
    },
    z.string().max(maxLength).optional(),
  )

const referenceCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, 'Code must contain at least 2 characters')
  .max(50, 'Code cannot exceed 50 characters')
  .regex(
    /^[A-Z0-9][A-Z0-9_-]*$/,
    'Code must use uppercase letters, numbers, underscores, or hyphens',
  )

export const referenceCategoryInputSchema = z.object({
  code: referenceCodeSchema,
  nameEn: z.string().trim().min(2, 'English name is required').max(120),
  nameAr: optionalTrimmed(120),
  description: optionalTrimmed(500),
})

export const referenceValueInputSchema = z.object({
  code: referenceCodeSchema,
  nameEn: z.string().trim().min(1, 'English value is required').max(150),
  nameAr: optionalTrimmed(150),
  description: optionalTrimmed(500),
  displayOrder: z.coerce.number().int().min(0).max(9999),
  isDefault: z.boolean(),
})

export const referenceRecordIdSchema = z.string().trim().min(1).max(100)

export type ReferenceCategoryInput = z.infer<typeof referenceCategoryInputSchema>
export type ReferenceValueInput = z.infer<typeof referenceValueInputSchema>
