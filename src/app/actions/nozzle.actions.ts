'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import { Prisma } from '../../../prisma/generated/client'
import { nozzleInputSchema, firstZodMessage } from '@/lib/validation/equipment.schema'

export type NozzleActionResult = {
  success: boolean
  error?: string
}

function readNozzleFormData(formData: FormData) {
  return {
    nozzleNumber: formData.get('nozzleNumber'),
    fuelType: formData.get('fuelType'),
  }
}

// ── Add a nozzle to an existing dispenser (ADMIN/MANAGER) ──────
export async function addNozzle(
  dispenserId: string,
  formData: FormData,
): Promise<NozzleActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    if (!dispenserId) return { success: false, error: 'Dispenser ID is required' }

    const dispenser = await prisma.dispenser.findUnique({
      where: { id: dispenserId },
      select: { branchId: true },
    })
    if (!dispenser) return { success: false, error: 'Dispenser not found' }

    await requireBranchAccess(dispenser.branchId)

    const parsed = nozzleInputSchema.safeParse(readNozzleFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }

    await prisma.nozzle.create({
      data: {
        dispenserID: dispenserId,
        nozzleNumber: parsed.data.nozzleNumber,
        fuelType: parsed.data.fuelType,
        createdBy: actor.id,
      },
    })

    revalidatePath('/dispensers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A nozzle with this number already exists on this dispenser' }
    }
    console.error('Failed to add nozzle:', error)
    return { success: false, error: 'Failed to add nozzle' }
  }
}

// ── Edit a nozzle's number/fuel type (ADMIN/MANAGER) ────────────
export async function updateNozzle(
  nozzleId: string,
  formData: FormData,
): Promise<NozzleActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    if (!nozzleId) return { success: false, error: 'Nozzle ID is required' }

    const nozzle = await prisma.nozzle.findUnique({
      where: { id: nozzleId },
      select: { dispenser: { select: { branchId: true } } },
    })
    if (!nozzle) return { success: false, error: 'Nozzle not found' }

    await requireBranchAccess(nozzle.dispenser.branchId)

    const parsed = nozzleInputSchema.safeParse(readNozzleFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }

    await prisma.nozzle.update({
      where: { id: nozzleId },
      data: {
        nozzleNumber: parsed.data.nozzleNumber,
        fuelType: parsed.data.fuelType,
        updatedBy: actor.id,
      },
    })

    revalidatePath('/dispensers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A nozzle with this number already exists on this dispenser' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Nozzle not found' }
    }
    console.error('Failed to update nozzle:', error)
    return { success: false, error: 'Failed to update nozzle' }
  }
}

// ── Decommission / restore a nozzle (ADMIN/MANAGER) ─────────────
// Soft-disabled, never deleted: historical sales must keep a valid FK.
export async function setNozzleActive(
  nozzleId: string,
  isActive: boolean,
): Promise<NozzleActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const nozzle = await prisma.nozzle.findUnique({
      where: { id: nozzleId },
      select: { dispenser: { select: { branchId: true } } },
    })
    if (!nozzle) return { success: false, error: 'Nozzle not found' }

    await requireBranchAccess(nozzle.dispenser.branchId)

    await prisma.nozzle.update({
      where: { id: nozzleId },
      data: { isActive, updatedBy: actor.id },
    })

    revalidatePath('/dispensers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to update nozzle status:', error)
    return { success: false, error: 'Failed to update nozzle status' }
  }
}
