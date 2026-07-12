// 'use server'

// import { prisma } from '@/lib/prisma'
// import { revalidatePath } from 'next/cache'

// // ── Update dispenser status ──────────────────────────────────
// export async function updatePumpStatus(
//   pumpId: string,
//   status: 'IDLE' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE'
// ) {
//   try {
//     await prisma.pump.update({
//       where: { id: pumpId },
//       data:  { status },
//     })

//     // Tell Next.js to refresh the pumps page data
//     revalidatePath('/pumps')
//     revalidatePath('/dashboard')

//     return { success: true }
//   } catch (error) {
//     return { success: false, error: 'Failed to update pump status' }
//   }
// }

// // ── Update pump reading ─────────────────────────────────
// export async function updatePumpReading(
//   pumpId: string,
//   reading: number
// ) {
//   try {
//     await prisma.pump.update({
//       where: { id: pumpId },
//       data:  { currentReading: reading },
//     })

//     revalidatePath('/pumps')
//     return { success: true }
//   } catch (error) {
//     return { success: false, error: 'Failed to update reading' }
//   }
// }

// // ── Add a new pump ──────────────────────────────────────
// export async function addPump(formData: FormData) {
//   const pumpNumber = Number(formData.get('pumpNumber'))
//   const fuelType   = formData.get('fuelType') as string

//   // Validate
//   if (!pumpNumber || !fuelType) {
//     return { success: false, error: 'All fields are required' }
//   }

//   try {
//     await prisma.pump.create({
//       data: {
//         pumpNumber,
//         fuelType:      fuelType as any,
//         status:        'IDLE',
//         currentReading: 0,
//       },
//     })

//     revalidatePath('/pumps')
//     return { success: true }
//   } catch (error) {
//     // Unique constraint on pumpNumber
//     return { success: false, error: 'Pump number already exists' }
//   }
// }