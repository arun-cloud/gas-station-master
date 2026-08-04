'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '../../../prisma/generated/client'
import { resolveActiveBranch } from '@/lib/branch-context'
import { ForbiddenError, requireRole } from '@/lib/rbac'
import {
  StationShiftDomainError,
  closeBusinessDay,
  closeStationShift,
  emergencyCloseStationShift,
  openBusinessDay,
  openStationShift,
} from '@/lib/services/station-shift-service'
import type { StationShiftActionResult } from '@/lib/station-shifts/types'
import {
  closeBusinessDayInputSchema,
  closeStationShiftInputSchema,
  emergencyCloseStationShiftInputSchema,
  openBusinessDayInputSchema,
  openStationShiftInputSchema,
} from '@/lib/validation/station-shift.schema'

const STATION_SHIFTS_PATH = '/operations/shifts'

async function getAuthorizedBranch(allowedRoles: Array<'ADMIN' | 'MANAGER' | 'CASHIER'>) {
  const actor = await requireRole(allowedRoles)
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) throw new ForbiddenError('An active branch is required')
  if (actor.role !== 'ADMIN' && !actor.branchIds.includes(activeBranch.id)) {
    throw new ForbiddenError('You do not have access to the active branch')
  }

  return { actor, branchId: activeBranch.id }
}

function validationFailure(message?: string): StationShiftActionResult {
  return { success: false, error: message ?? 'Invalid station shift request' }
}

function handleActionError(error: unknown, fallback: string): StationShiftActionResult {
  if (error instanceof ForbiddenError || error instanceof StationShiftDomainError) {
    return { success: false, error: error.message }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return { success: false, error: 'Another business day or station shift is already open' }
  }

  console.error(fallback, error)
  return { success: false, error: fallback }
}

export async function openBusinessDayAction(input: unknown): Promise<StationShiftActionResult> {
  try {
    const parsed = openBusinessDayInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error.issues[0]?.message)
    const { actor, branchId } = await getAuthorizedBranch(['ADMIN', 'MANAGER'])
    await openBusinessDay(branchId, actor.id, parsed.data)
    revalidatePath(STATION_SHIFTS_PATH)
    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to open business day')
  }
}

export async function openStationShiftAction(input: unknown): Promise<StationShiftActionResult> {
  try {
    const parsed = openStationShiftInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error.issues[0]?.message)
    const { actor, branchId } = await getAuthorizedBranch(['ADMIN', 'MANAGER', 'CASHIER'])
    await openStationShift(branchId, actor.id, parsed.data)
    revalidatePath(STATION_SHIFTS_PATH)
    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to open station shift')
  }
}

export async function closeStationShiftAction(input: unknown): Promise<StationShiftActionResult> {
  try {
    const parsed = closeStationShiftInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error.issues[0]?.message)
    const { actor, branchId } = await getAuthorizedBranch(['ADMIN', 'MANAGER', 'CASHIER'])
    await closeStationShift(branchId, actor.id, parsed.data)
    revalidatePath(STATION_SHIFTS_PATH)
    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to close station shift')
  }
}

export async function emergencyCloseStationShiftAction(input: unknown): Promise<StationShiftActionResult> {
  try {
    const parsed = emergencyCloseStationShiftInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error.issues[0]?.message)
    const { actor, branchId } = await getAuthorizedBranch(['ADMIN', 'MANAGER'])
    await emergencyCloseStationShift(branchId, actor.id, parsed.data)
    revalidatePath(STATION_SHIFTS_PATH)
    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to emergency-close station shift')
  }
}

export async function closeBusinessDayAction(input: unknown): Promise<StationShiftActionResult> {
  try {
    const parsed = closeBusinessDayInputSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error.issues[0]?.message)
    const { actor, branchId } = await getAuthorizedBranch(['ADMIN', 'MANAGER'])
    await closeBusinessDay(branchId, actor.id, parsed.data)
    revalidatePath(STATION_SHIFTS_PATH)
    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to close business day')
  }
}
