'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import { Prisma } from '../../../prisma/generated/client'
import { tankInputSchema, firstZodMessage } from '@/lib/validation/equipment.schema'

export type TankActionResult = {
  success: boolean
  error?: string
}

function readTankFormData(formData: FormData) {
  return {
    branchId: formData.get('branchId'),
    tankNumber: formData.get('tankNumber'),
    fuelType: formData.get('fuelType'),
    capacity: formData.get('capacity'),
    currentLevel: formData.get('currentLevel'),
    minLevel: formData.get('minLevel'),
  }
}

// ── Create a tank (ADMIN or MANAGER, within an accessible branch) ──
export async function createTank(formData: FormData): Promise<TankActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const parsed = tankInputSchema.safeParse(readTankFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }
    const data = parsed.data

    await requireBranchAccess(data.branchId)

    await prisma.fuelTank.create({
      data: {
        branchId: data.branchId,
        tankNumber: data.tankNumber,
        fuelType: data.fuelType,
        capacity: data.capacity,
        currentLevel: data.currentLevel,
        minLevel: data.minLevel,
        createdBy: actor.id,
      },
    })

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A tank with this number already exists at this branch' }
    }
    console.error('Failed to create tank:', error)
    return { success: false, error: 'Failed to create tank' }
  }
}

// ── Update a tank (ADMIN or MANAGER, within an accessible branch) ──
export async function updateTank(tankId: string, formData: FormData): Promise<TankActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    if (!tankId) return { success: false, error: 'Tank ID is required' }

    const existing = await prisma.fuelTank.findUnique({
      where: { id: tankId },
      select: { branchId: true },
    })
    if (!existing) return { success: false, error: 'Tank not found' }

    const parsed = tankInputSchema.safeParse(readTankFormData(formData))
    if (!parsed.success) {
      return { success: false, error: firstZodMessage(parsed.error) }
    }
    const data = parsed.data

    // Must have access to both the tank's current branch and its target branch.
    await requireBranchAccess(existing.branchId)
    if (data.branchId !== existing.branchId) {
      await requireBranchAccess(data.branchId)
    }

    await prisma.fuelTank.update({
      where: { id: tankId },
      data: {
        branchId: data.branchId,
        tankNumber: data.tankNumber,
        fuelType: data.fuelType,
        capacity: data.capacity,
        currentLevel: data.currentLevel,
        minLevel: data.minLevel,
        updatedBy: actor.id,
      },
    })

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A tank with this number already exists at this branch' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Tank not found' }
    }
    console.error('Failed to update tank:', error)
    return { success: false, error: 'Failed to update tank' }
  }
}

// ── Decommission / restore a tank (ADMIN or MANAGER) ──────────
// Tanks are soft-disabled, never deleted: deliveries and historical
// reconciliation records must keep a valid foreign key.
export async function setTankActive(tankId: string, isActive: boolean): Promise<TankActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const existing = await prisma.fuelTank.findUnique({
      where: { id: tankId },
      select: { branchId: true },
    })
    if (!existing) return { success: false, error: 'Tank not found' }

    await requireBranchAccess(existing.branchId)

    await prisma.fuelTank.update({
      where: { id: tankId },
      data: { isActive, updatedBy: actor.id },
    })

    revalidatePath('/fuel')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to update tank status:', error)
    return { success: false, error: 'Failed to update tank status' }
  }
}
