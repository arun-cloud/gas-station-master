'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import { Prisma, type DispenserStatus } from '../../../prisma/generated/client'
import { dispenserInputSchema, firstZodMessage } from '@/lib/validation/equipment.schema'

export type DispenserActionResult = {
  success: boolean
  error?: string
}

function readDispenserFormData(formData: FormData) {
  const nozzleCount = Number(formData.get('nozzleCount') ?? 0)
  const safeCount = Number.isFinite(nozzleCount) && nozzleCount > 0 ? nozzleCount : 0

  const nozzles = Array.from({ length: safeCount }, (_, index) => ({
    nozzleNumber: formData.get(`nozzleNumber_${index}`),
    fuelType: formData.get(`fuelType_${index}`),
  }))

  return {
    branchId: formData.get('branchId'),
    dispenserNumber: formData.get('dispenserNumber'),
    nozzles,
  }
}

// ── Create a dispenser with its nozzles, atomically (ADMIN/MANAGER) ──
export async function createDispenser(formData: FormData): Promise<DispenserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const parsed = dispenserInputSchema.safeParse(readDispenserFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }
    const data = parsed.data

    await requireBranchAccess(data.branchId)

    await prisma.dispenser.create({
      data: {
        branchId: data.branchId,
        dispenserNumber: data.dispenserNumber,
        status: 'IDLE',
        createdBy: actor.id,
        nozzles: {
          create: data.nozzles.map(nozzle => ({
            nozzleNumber: nozzle.nozzleNumber,
            fuelType: nozzle.fuelType,
            createdBy: actor.id,
          })),
        },
      },
    })

    revalidatePath('/dispensers')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A dispenser or nozzle with this number already exists' }
    }
    console.error('Failed to create dispenser:', error)
    return { success: false, error: 'Failed to create dispenser' }
  }
}

// ── Update a dispenser's branch/number (ADMIN/MANAGER) ────────
export async function updateDispenser(
  dispenserId: string,
  formData: FormData,
): Promise<DispenserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    if (!dispenserId) return { success: false, error: 'Dispenser ID is required' }

    const existing = await prisma.dispenser.findUnique({
      where: { id: dispenserId },
      select: { branchId: true },
    })
    if (!existing) return { success: false, error: 'Dispenser not found' }

    const branchId = String(formData.get('branchId') ?? '').trim()
    const dispenserNumber = Number(formData.get('dispenserNumber'))

    if (!branchId) return { success: false, error: 'Branch is required' }
    if (!Number.isInteger(dispenserNumber) || dispenserNumber <= 0) {
      return { success: false, error: 'Enter a valid dispenser number' }
    }

    await requireBranchAccess(existing.branchId)
    if (branchId !== existing.branchId) {
      await requireBranchAccess(branchId)
    }

    await prisma.dispenser.update({
      where: { id: dispenserId },
      data: { branchId, dispenserNumber, updatedBy: actor.id },
    })

    revalidatePath('/dispensers')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A dispenser with this number already exists at this branch' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Dispenser not found' }
    }
    console.error('Failed to update dispenser:', error)
    return { success: false, error: 'Failed to update dispenser' }
  }
}

// ── Operational status: IDLE / ACTIVE / MAINTENANCE / OFFLINE (ADMIN/MANAGER) ──
export async function updateDispenserStatus(
  dispenserId: string,
  status: DispenserStatus,
): Promise<DispenserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    if (!dispenserId) return { success: false, error: 'Dispenser ID is required' }

    const existing = await prisma.dispenser.findUnique({
      where: { id: dispenserId },
      select: { branchId: true },
    })
    if (!existing) return { success: false, error: 'Dispenser not found' }

    await requireBranchAccess(existing.branchId)

    await prisma.dispenser.update({
      where: { id: dispenserId },
      data: { status, updatedBy: actor.id },
    })

    revalidatePath('/dispensers')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to update dispenser status:', error)
    return { success: false, error: 'Failed to update dispenser status' }
  }
}

// ── Decommission / restore a dispenser (ADMIN/MANAGER) ────────
// Soft-disabled, never deleted: historical sales must keep a valid FK.
export async function setDispenserActive(
  dispenserId: string,
  isActive: boolean,
): Promise<DispenserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const existing = await prisma.dispenser.findUnique({
      where: { id: dispenserId },
      select: { branchId: true },
    })
    if (!existing) return { success: false, error: 'Dispenser not found' }

    await requireBranchAccess(existing.branchId)

    await prisma.dispenser.update({
      where: { id: dispenserId },
      data: { isActive, updatedBy: actor.id },
    })

    revalidatePath('/dispensers')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to update dispenser status:', error)
    return { success: false, error: 'Failed to update dispenser status' }
  }
}
