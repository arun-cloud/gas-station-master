'use server'

import { prisma }         from '@/lib/prisma'
import { revalidatePath }  from 'next/cache'
import bcrypt              from 'bcryptjs'
import { requireRole, requireUserOrThrow, ForbiddenError } from '@/lib/rbac'
import type { Role } from '../../../prisma/generated/client'

const VALID_ROLES: Role[] = ['ADMIN', 'MANAGER', 'CASHIER']

// ── Add employee ────────────────────────────────────────
// NOTE: this creates the user active immediately (trusted admin/manager
// context, unlike public self-registration). It does not yet assign a
// branch — use /admin/users to assign branch access after creation.
// Branch selection in this form is a follow-up item for Phase 2.
export async function addEmployee(formData: FormData) {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    const name     = formData.get('name')     as string
    const email    = formData.get('email')    as string
    const password = formData.get('password') as string
    const role     = formData.get('role')     as string

    if (!name || !email || !password || !role) {
      return { success: false, error: 'All fields are required' }
    }

    if (!VALID_ROLES.includes(role as Role)) {
      return { success: false, error: 'Select a valid role' }
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { success: false, error: 'Email already registered' }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role:     role as Role,
        isActive: true,
        createdBy: actor.id,
      },
    })

    revalidatePath('/employees')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to add employee' }
  }
}

// ── Toggle employee active status ───────────────────────
export async function toggleEmployeeStatus(
  userId: string,
  isActive: boolean
) {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    await prisma.user.update({
      where: { id: userId },
      data:  { isActive, updatedBy: actor.id },
    })
    revalidatePath('/employees')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update status' }
  }
}

// ── Clock in ────────────────────────────────────────────
export async function clockIn(userId: string, openingCash: number) {
  try {
    await requireUserOrThrow()

    // Check no active shift already open
    const existing = await prisma.shift.findFirst({
      where: { userId, status: 'ACTIVE' },
    })
    if (existing) {
      return { success: false, error: 'Employee already has an active shift' }
    }

    await prisma.shift.create({
      data: {
        userId,
        startTime:   new Date(),
        openingCash,
        status:      'ACTIVE',
      },
    })

    revalidatePath('/employees')
    revalidatePath('/employees/shifts')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to clock in' }
  }
}

// ── Clock out ───────────────────────────────────────────
export async function clockOut(
  shiftId:     string,
  closingCash: number,
  notes:       string
) {
  try {
    await requireUserOrThrow()

    await prisma.shift.update({
      where: { id: shiftId },
      data:  {
        endTime:     new Date(),
        closingCash,
        notes:       notes || null,
        status:      'CLOSED',
      },
    })

    revalidatePath('/employees')
    revalidatePath('/employees/shifts')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to clock out' }
  }
}

// ── Update employee role ─────────────────────────────────
export async function updateEmployeeRole(
  userId: string,
  role:   string
) {
  try {
    const actor = await requireRole(['ADMIN'])

    if (!VALID_ROLES.includes(role as Role)) {
      return { success: false, error: 'Select a valid role' }
    }

    await prisma.user.update({
      where: { id: userId },
      data:  { role: role as Role, updatedBy: actor.id },
    })
    revalidatePath('/employees')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update role' }
  }
}