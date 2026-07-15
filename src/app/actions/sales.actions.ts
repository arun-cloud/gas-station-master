'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { resolveActiveBranch } from '@/lib/branch-context'
import { ForbiddenError, requireUserOrThrow } from '@/lib/rbac'
import type {
  FuelType,
  PaymentMethod,
} from '../../../prisma/generated/client'

const FUEL_PRICES: Record<FuelType, number> = {
  PETROL_91: 1.25,
  PETROL_95: 1.45,
  DIESEL: 0.75,
  PREMIUM_DIESEL: 1.75,
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return (
    value === 'CASH' ||
    value === 'CARD' ||
    value === 'LOYALTY_POINTS'
  )
}

export async function recordSale(formData: FormData) {
  try {
    const currentUser = await requireUserOrThrow()
    const { activeBranch } = await resolveActiveBranch()

    if (!activeBranch) {
      return {
        success: false,
        error: 'No active branch selected',
      }
    }

    const nozzleId =
      formData.get('nozzleId')?.toString().trim() ?? ''

    const litres = Number(formData.get('litres'))

    const paymentMethodValue =
      formData.get('paymentMethod')?.toString() ?? ''

    const customerIdValue =
      formData.get('customerId')?.toString().trim() ?? ''

    const customerId = customerIdValue || null

    if (!nozzleId || !Number.isFinite(litres) || !paymentMethodValue) {
      return {
        success: false,
        error: 'Missing required fields',
      }
    }

    if (litres <= 0) {
      return {
        success: false,
        error: 'Litres must be greater than zero',
      }
    }

    if (!isPaymentMethod(paymentMethodValue)) {
      return {
        success: false,
        error: 'Invalid payment method',
      }
    }

    const nozzle = await prisma.nozzle.findUnique({
      where: {
        id: nozzleId,
      },
      include: {
        dispenser: {
          select: {
            id: true,
            branchId: true,
            dispenserNumber: true,
            status: true,
            isActive: true,
          },
        },
      },
    })

    if (!nozzle || !nozzle.isActive) {
      return {
        success: false,
        error: 'Nozzle not found or inactive',
      }
    }

    if (
      !nozzle.dispenser.isActive ||
      nozzle.dispenser.status !== 'ACTIVE'
    ) {
      return {
        success: false,
        error: 'Dispenser is not active',
      }
    }

    if (nozzle.dispenser.branchId !== activeBranch.id) {
      return {
        success: false,
        error: 'The selected nozzle does not belong to the active branch',
      }
    }

    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: {
          id: customerId,
        },
        select: {
          id: true,
        },
      })

      if (!customer) {
        return {
          success: false,
          error: 'Customer not found',
        }
      }
    }

    const pricePerLitre = FUEL_PRICES[nozzle.fuelType]
    const totalAmount = Number(
      (litres * pricePerLitre).toFixed(2),
    )

    const tank = await prisma.fuelTank.findFirst({
      where: {
        branchId: activeBranch.id,
        fuelType: nozzle.fuelType,
        isActive: true,
      },
      orderBy: {
        tankNumber: 'asc',
      },
    })

    if (!tank) {
      return {
        success: false,
        error: 'No active tank found for this fuel type',
      }
    }

    const sale = await prisma.$transaction(async tx => {
      /*
       * updateMany makes the stock check and decrement atomic.
       * Two simultaneous sales therefore cannot both consume the same
       * remaining fuel quantity.
       */
      const tankUpdate = await tx.fuelTank.updateMany({
        where: {
          id: tank.id,
          currentLevel: {
            gte: litres,
          },
        },
        data: {
          currentLevel: {
            decrement: litres,
          },
        },
      })

      if (tankUpdate.count !== 1) {
        throw new Error('INSUFFICIENT_FUEL')
      }

      await tx.nozzle.update({
        where: {
          id: nozzle.id,
        },
        data: {
          currentReading: {
            increment: litres,
          },
        },
      })

      const newSale = await tx.sale.create({
        data: {
          dispenserId: nozzle.dispenser.id,
          nozzleId: nozzle.id,
          userId: currentUser.id,
          customerId,
          fuelType: nozzle.fuelType,
          litres,
          pricePerLitre,
          totalAmount,
          paymentMethod: paymentMethodValue,
        },
      })

      if (customerId) {
        await tx.customer.update({
          where: {
            id: customerId,
          },
          data: {
            loyaltyPoints: {
              increment: Math.floor(litres),
            },
          },
        })
      }

      return newSale
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    revalidatePath('/fuel')
    revalidatePath('/pumps')

    return {
      success: true,
      sale: {
        id: sale.id,
        fuelType: nozzle.fuelType,
        litres,
        pricePerLitre,
        totalAmount,
        paymentMethod: paymentMethodValue,
        dispenserNumber: nozzle.dispenser.dispenserNumber,
        nozzleNumber: nozzle.nozzleNumber,
        createdAt: sale.createdAt.toISOString(),
      },
    }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (
      error instanceof Error &&
      error.message === 'INSUFFICIENT_FUEL'
    ) {
      return {
        success: false,
        error: 'Insufficient fuel in tank',
      }
    }

    console.error('Record sale failed:', error)

    return {
      success: false,
      error: 'Failed to record sale',
    }
  }
}

export async function getSalesByDate(date: string) {
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return []
  }

  const start = new Date(date)
  start.setHours(0, 0, 0, 0)

  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  return prisma.sale.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      dispenser: {
        branchId: activeBranch.id,
      },
    },
    include: {
      dispenser: {
        select: {
          dispenserNumber: true,
        },
      },
      nozzle: {
        select: {
          nozzleNumber: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}