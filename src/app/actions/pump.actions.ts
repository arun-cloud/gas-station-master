'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

import { FuelType, Prisma } from '../../../prisma/generated/client'

export type PumpActionResult = {
  success: boolean
  error?: string
}

/**
 * Update dispenser status.
 */
export async function updatePumpStatus(
  dispenserId: string,
  status: 'IDLE' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE',
): Promise<PumpActionResult> {
  if (!dispenserId) {
    return {
      success: false,
      error: 'Dispenser ID is required',
    }
  }

  try {
    await prisma.dispenser.update({
      where: {
        id: dispenserId,
      },
      data: {
        status,
      },
    })

    revalidatePath('/pumps')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('Failed to update dispenser status:', error)

    return {
      success: false,
      error: 'Failed to update dispenser status',
    }
  }
}

/**
 * A meter reading belongs to a nozzle, not the dispenser.
 */
export async function updateNozzleReading(
  nozzleId: string,
  reading: number,
): Promise<PumpActionResult> {
  if (!nozzleId) {
    return {
      success: false,
      error: 'Nozzle ID is required',
    }
  }

  if (!Number.isFinite(reading) || reading < 0) {
    return {
      success: false,
      error: 'Enter a valid meter reading',
    }
  }

  try {
    await prisma.nozzle.update({
      where: {
        id: nozzleId,
      },
      data: {
        currentReading: reading.toFixed(3),
      },
    })

    revalidatePath('/pumps')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('Failed to update nozzle reading:', error)

    return {
      success: false,
      error: 'Failed to update nozzle reading',
    }
  }
}

/**
 * Create one dispenser and all its nozzles atomically.
 */
export async function addPump(
  formData: FormData,
): Promise<PumpActionResult> {
  const branchId = String(
    formData.get('branchId') ?? '',
  ).trim()

  const dispenserNumber = Number(
    formData.get('dispenserNumber'),
  )

  const nozzleCount = Number(
    formData.get('nozzleCount'),
  )

  if (!branchId) {
    return {
      success: false,
      error: 'Branch is required',
    }
  }

  if (
    !Number.isInteger(dispenserNumber) ||
    dispenserNumber <= 0
  ) {
    return {
      success: false,
      error: 'Enter a valid dispenser number',
    }
  }

  if (
    !Number.isInteger(nozzleCount) ||
    nozzleCount < 1 ||
    nozzleCount > 12
  ) {
    return {
      success: false,
      error: 'A dispenser must have between 1 and 12 nozzles',
    }
  }

  const nozzles: Array<{
    nozzleNumber: number
    fuelType: FuelType
    currentReading: string
  }> = []

  const validFuelTypes = Object.values(FuelType)

  for (let index = 0; index < nozzleCount; index += 1) {
    const nozzleNumber = Number(
      formData.get(`nozzleNumber_${index}`),
    )

    const fuelType = String(
      formData.get(`fuelType_${index}`) ?? '',
    ) as FuelType

    const currentReading = Number(
      formData.get(`currentReading_${index}`),
    )

    if (
      !Number.isInteger(nozzleNumber) ||
      nozzleNumber <= 0
    ) {
      return {
        success: false,
        error: `Enter a valid number for nozzle ${index + 1}`,
      }
    }

    if (!validFuelTypes.includes(fuelType)) {
      return {
        success: false,
        error: `Select a valid fuel type for nozzle ${nozzleNumber}`,
      }
    }

    if (
      !Number.isFinite(currentReading) ||
      currentReading < 0
    ) {
      return {
        success: false,
        error: `Enter a valid reading for nozzle ${nozzleNumber}`,
      }
    }

    nozzles.push({
      nozzleNumber,
      fuelType,
      currentReading: currentReading.toFixed(3),
    })
  }

  const nozzleNumbers = nozzles.map(
    nozzle => nozzle.nozzleNumber,
  )

  if (
    new Set(nozzleNumbers).size !==
    nozzleNumbers.length
  ) {
    return {
      success: false,
      error: 'Nozzle numbers cannot be duplicated',
    }
  }

  const branchExists = await prisma.branch.findUnique({
    where: {
      id: branchId,
    },
    select: {
      id: true,
    },
  })

  if (!branchExists) {
    return {
      success: false,
      error: 'The selected branch does not exist',
    }
  }

  try {
    await prisma.dispenser.create({
      data: {
        branchId,
        dispenserNumber,
        status: 'IDLE',

        nozzles: {
          create: nozzles,
        },
      },
    })

    revalidatePath('/pumps')
    revalidatePath('/dashboard')

    return {
      success: true,
    }
  } catch (error: unknown) {
    console.error('Failed to create dispenser:', error)

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return {
        success: false,
        error:
          'The dispenser number or nozzle number already exists',
      }
    }

    return {
      success: false,
      error: 'Failed to create dispenser',
    }
  }
}