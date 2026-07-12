'use server'

import { prisma }        from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Fuel prices per litre in SAR — in production these come from a settings table
const FUEL_PRICES: Record<string, number> = {
  PETROL_91:      1.25,
  PETROL_95:      1.45,
  DIESEL:         0.75,
  PREMIUM_DIESEL: 1.75,
}

export async function recordSale(formData: FormData) {
  const pumpId        = formData.get('pumpId')        as string
  const litres        = Number(formData.get('litres'))
  const paymentMethod = formData.get('paymentMethod') as string
  const customerId    = formData.get('customerId')    as string | null
  const userId        = formData.get('userId')        as string

  if (!pumpId || !litres || !paymentMethod || !userId) {
    return { success: false, error: 'Missing required fields' }
  }
  if (litres <= 0) {
    return { success: false, error: 'Litres must be greater than 0' }
  }

  try {
    // Get pump to know fuel type
    const pump = await prisma.pump.findUnique({ where: { id: pumpId } })
    if (!pump) return { success: false, error: 'Pump not found' }

    const pricePerLitre = FUEL_PRICES[pump.fuelType] ?? 1.00
    const totalAmount   = parseFloat((litres * pricePerLitre).toFixed(2))

    // Find the tank for this fuel type — to decrement level
    const tank = await prisma.fuelTank.findFirst({
      where: { fuelType: pump.fuelType },
    })

    if (!tank) return { success: false, error: 'No tank found for this fuel type' }
    if (Number(tank.currentLevel) < litres) {
      return { success: false, error: 'Insufficient fuel in tank' }
    }

    // Transaction: create sale + decrement tank + update pump reading
    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          pumpId,
          userId,
          customerId:    customerId || null,
          fuelType:      pump.fuelType as any,
          litres,
          pricePerLitre,
          totalAmount,
          paymentMethod: paymentMethod as any,
        },
      })

      // Decrement tank level
      await tx.fuelTank.update({
        where: { id: tank.id },
        data:  { currentLevel: Number(tank.currentLevel) - litres },
      })

      // Update pump reading
      await tx.pump.update({
        where: { id: pumpId },
        data:  { currentReading: Number(pump.currentReading) + litres },
      })

      // Award loyalty points if customer (1 point per litre)
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data:  { loyaltyPoints: { increment: Math.floor(litres) } },
        })
      }

      return newSale
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    revalidatePath('/fuel')

    return {
      success: true,
      sale: {
        id:             sale.id,
        fuelType:       pump.fuelType,
        litres,
        pricePerLitre,
        totalAmount,
        paymentMethod,
        createdAt:      sale.createdAt.toISOString(),
      },
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: 'Failed to record sale' }
  }
}

export async function getSalesByDate(date: string) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prisma.sale.findMany({
    where:   { createdAt: { gte: start, lte: end } },
    include: {
      pump:     { select: { pumpNumber: true } },
      user:     { select: { name: true } },
      customer: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}