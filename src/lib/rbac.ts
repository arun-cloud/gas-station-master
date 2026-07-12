import 'server-only'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import type { Role } from '../../prisma/generated/client'

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

/**
 * Use in Server Components that render a full page.
 * Redirects to /login when there is no active session.
 * (Defense in depth — middleware.ts already blocks the route.)
 */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Use inside Server Actions / Route Handlers, where a redirect would be
 * the wrong UX — throws instead so the caller can return a typed
 * { success: false, error } response.
 */
export async function requireUserOrThrow() {
  const user = await getCurrentUser()
  if (!user) {
    throw new ForbiddenError('You must be signed in to perform this action')
  }
  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await requireUserOrThrow()
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
    )
  }
  return user
}

/**
 * Ensures the current user has access to the given branch.
 * ASSUMPTION: ADMIN bypasses branch scoping (company-wide access).
 * MANAGER/CASHIER must have an explicit UserBranch row.
 */
export async function requireBranchAccess(branchId: string) {
  const user = await requireUserOrThrow()

  if (user.role === 'ADMIN') {
    return user
  }

  if (!user.branchIds.includes(branchId)) {
    throw new ForbiddenError('You do not have access to this branch')
  }

  return user
}
