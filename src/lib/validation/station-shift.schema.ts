import { z } from 'zod'

const recordIdSchema = z.string().trim().min(1).max(100)

const decimalInput = z.union([z.string(), z.number()]).transform(value => String(value).trim())

const nonNegativeDecimal = decimalInput.refine(
  value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
  'Value must be a valid non-negative number',
)

const positiveDecimal = decimalInput.refine(
  value => value !== '' && Number.isFinite(Number(value)) && Number(value) > 0,
  'Unit price must be greater than zero',
)

const signedDecimal = decimalInput.refine(
  value => value !== '' && Number.isFinite(Number(value)),
  'Adjustment must be a valid number',
)

export const openBusinessDayInputSchema = z.object({
  businessDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Business date must use YYYY-MM-DD')
    .optional(),
  openingNotes: z.string().trim().max(500).optional(),
})

export const openStationShiftInputSchema = z.object({
  openingCash: nonNegativeDecimal,
  notes: z.string().trim().max(500).optional(),
  nozzlePrices: z
    .array(
      z.object({
        nozzleId: recordIdSchema,
        unitPrice: positiveDecimal,
      }),
    )
    .min(1, 'At least one active nozzle is required'),
})

const closingReadingSchema = z.object({
  readingId: recordIdSchema,
  closingReading: nonNegativeDecimal,
  testLitres: nonNegativeDecimal,
  adjustmentLitres: signedDecimal,
})

export const closeStationShiftInputSchema = z.object({
  shiftId: recordIdSchema,
  closingCash: nonNegativeDecimal,
  notes: z.string().trim().max(500).optional(),
  readings: z.array(closingReadingSchema).min(1, 'Nozzle readings are required'),
})

export const emergencyCloseStationShiftInputSchema = closeStationShiftInputSchema.extend({
  emergencyReason: z.string().trim().min(10).max(500),
})

export const closeBusinessDayInputSchema = z.object({
  businessDayId: recordIdSchema,
  closingNotes: z.string().trim().max(500).optional(),
})

export type OpenBusinessDayInput = z.infer<typeof openBusinessDayInputSchema>
export type OpenStationShiftInput = z.infer<typeof openStationShiftInputSchema>
export type CloseStationShiftInput = z.infer<typeof closeStationShiftInputSchema>
export type EmergencyCloseStationShiftInput = z.infer<
  typeof emergencyCloseStationShiftInputSchema
>
export type CloseBusinessDayInput = z.infer<typeof closeBusinessDayInputSchema>
