'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'


// ── Record a fuel delivery ──────────────────────────────
export async function recordDelivery(formData: FormData) {
  const purchaseOrderId = formData.get('purchaseOrderId')?.toString().trim() ?? ''
  const tankId = formData.get('tankId') as string
  const supplierId = formData.get('supplierId') as string
  const litres = Number(formData.get('litres'))
  const pricePerLitre = Number(formData.get('pricePerLitre'))
  const notes = formData.get('notes') as string


  if (
    !tankId ||
    !supplierId ||
    !purchaseOrderId ||
    !Number.isFinite(litres) ||
    !Number.isFinite(pricePerLitre)
  ) {
    return {
      success: false,
      error: 'Tank, supplier, purchase order, litres and price are required',
    }
  }

  const purchaseOrder = await prisma.purchaseOrder.findFirst({
    where: {
      id: purchaseOrderId,
      supplierId,
      status: {
        in: ['PENDING', 'CONFIRMED'],
      },
    },
    select: {
      id: true,
    },
  })

  if (!purchaseOrder) {
    return {
      success: false,
      error: 'Invalid purchase order for the selected supplier',
    }
  }


  if (litres <= 0 || pricePerLitre <= 0) {
    return { success: false, error: 'Litres and price must be positive' }
  }

  try {
    // Get current tank to check capacity
    const tank = await prisma.fuelTank.findUnique({ where: { id: tankId } })
    if (!tank) return { success: false, error: 'Tank not found' }

    const newLevel = Number(tank.currentLevel) + litres

    // Don't overfill the tank
    if (newLevel > Number(tank.capacity)) {
      return {
        success: false,
        error: `Tank capacity exceeded. Max ${Number(tank.capacity) - Number(tank.currentLevel)} L can be added.`
      }
    }

    // Run both writes in a transaction — either both succeed or both fail
    await prisma.$transaction([
      prisma.fuelDelivery.create({
        data: {
          tankId,
          supplierId,
          purchaseOrderId,
          litresDelivered: litres,
          pricePerLitre,
          notes: notes || null,
        },
      }),
      prisma.fuelTank.update({
        where: { id: tankId },
        data: { currentLevel: newLevel },
      }),
    ])

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to record delivery' }
  }
}

// ── Manually adjust tank level ──────────────────────────
export async function adjustTankLevel(
  tankId: string,
  newLevel: number
) {
  try {
    const tank = await prisma.fuelTank.findUnique({ where: { id: tankId } })
    if (!tank) return { success: false, error: 'Tank not found' }

    if (newLevel < 0 || newLevel > Number(tank.capacity)) {
      return { success: false, error: 'Level must be between 0 and tank capacity' }
    }

    await prisma.fuelTank.update({
      where: { id: tankId },
      data: { currentLevel: newLevel },
    })

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to adjust level' }
  }
}

// ── Update minimum alert level ──────────────────────────
export async function updateMinLevel(
  tankId: string,
  minLevel: number
) {
  try {
    await prisma.fuelTank.update({
      where: { id: tankId },
      data: { minLevel },
    })

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update minimum level' }
  }
}

// ── Fetch pending purchase orders for a supplier ────────
export async function getPendingPurchaseOrders(supplierId: string) {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      select: {
        id: true,
        orderNumber: true,
      },
    })
    return { success: true, orders }
  } catch (error) {
    return { success: false, error: 'Failed to fetch purchase orders' }
  }
}
