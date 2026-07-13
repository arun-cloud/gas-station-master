import { z } from 'zod'

// Kept as a plain tuple (not imported from the Prisma enum) so this module
// has no dependency on the generated Prisma client — validation should be
// usable anywhere without pulling in the DB client.
export const FUEL_TYPE_VALUES = [
  'PETROL_91',
  'PETROL_95',
  'DIESEL',
  'PREMIUM_DIESEL',
] as const

export type FuelTypeValue = (typeof FUEL_TYPE_VALUES)[number]

// ─── Fuel Tank ──────────────────────────────────────────────
export const tankInputSchema = z
  .object({
    branchId: z.string().min(1, 'Branch is required'),
    tankNumber: z.coerce
      .number()
      .int('Tank number must be a whole number')
      .positive('Tank number must be a positive integer'),
    fuelType: z.enum(FUEL_TYPE_VALUES),
    capacity: z.coerce.number().positive('Capacity must be greater than zero'),
    currentLevel: z.coerce.number().min(0, 'Current level cannot be negative'),
    minLevel: z.coerce.number().min(0, 'Minimum level cannot be negative'),
  })
  .refine(data => data.currentLevel <= data.capacity, {
    message: 'Current level cannot exceed tank capacity',
    path: ['currentLevel'],
  })
  .refine(data => data.minLevel <= data.capacity, {
    message: 'Minimum alert level cannot exceed tank capacity',
    path: ['minLevel'],
  })

export type TankInput = z.infer<typeof tankInputSchema>

// ─── Nozzle ─────────────────────────────────────────────────
export const nozzleInputSchema = z.object({
  nozzleNumber: z.coerce
    .number()
    .int('Nozzle number must be a whole number')
    .positive('Nozzle number must be a positive integer'),
  fuelType: z.enum(FUEL_TYPE_VALUES),
})

export type NozzleInput = z.infer<typeof nozzleInputSchema>

// ─── Dispenser (with its initial nozzles) ──────────────────
export const dispenserInputSchema = z.object({
  branchId: z.string().min(1, 'Branch is required'),
  dispenserNumber: z.coerce
    .number()
    .int('Dispenser number must be a whole number')
    .positive('Dispenser number must be a positive integer'),
  nozzles: z
    .array(nozzleInputSchema)
    .min(1, 'A dispenser needs at least one nozzle')
    .max(12, 'A dispenser cannot have more than 12 nozzles')
    .refine(
      nozzles => new Set(nozzles.map(nozzle => nozzle.nozzleNumber)).size === nozzles.length,
      { message: 'Nozzle numbers must be unique within a dispenser' },
    ),
})

export type DispenserInput = z.infer<typeof dispenserInputSchema>

// ─── Shared helper: first readable message from a ZodError ─
export function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Invalid input'
}
