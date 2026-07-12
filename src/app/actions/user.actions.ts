'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireRole, ForbiddenError } from '@/lib/rbac'
import type { Role } from '../../../prisma/generated/client'

export type UserActionResult = {
  success: boolean
  error?: string
}

/**
 * Activate a pending self-registered user: sets isActive=true, assigns
 * a role, and replaces their branch access with the given branch list.
 * First branch in the list becomes the primary branch.
 */
export async function activateUser(
  userId: string,
  branchIds: string[],
  role: Role,
): Promise<UserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    if (!userId) {
      return { success: false, error: 'User is required' }
    }

    if (branchIds.length === 0) {
      return { success: false, error: 'Assign at least one branch' }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          role,
          updatedBy: actor.id,
        },
      }),
      prisma.userBranch.deleteMany({ where: { userId } }),
      prisma.userBranch.createMany({
        data: branchIds.map((branchId, index) => ({
          userId,
          branchId,
          isPrimary: index === 0,
        })),
      }),
    ])

    revalidatePath('/admin/users')
    revalidatePath('/employees')
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to activate user:', error)
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to activate user' }
  }
}

/**
 * Deactivate a user (revokes access without deleting their record —
 * also used to reject a pending self-registration).
 */
export async function deactivateUser(
  userId: string,
): Promise<UserActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false, updatedBy: actor.id },
    })

    revalidatePath('/admin/users')
    revalidatePath('/employees')
    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to deactivate user:', error)
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to deactivate user' }
  }
}
