import 'server-only'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'

export const ACTIVE_BRANCH_COOKIE = 'active_branch_id'

export type AccessibleBranch = {
  id: string
  nameEn: string
  nameAr: string
  branchCode: string
}

/**
 * Branches the current user is allowed to see.
 * ADMIN: every active branch (company-wide access).
 * MANAGER / CASHIER: only branches with an explicit UserBranch row.
 */
export async function getAccessibleBranches(): Promise<AccessibleBranch[]> {
  const user = await getCurrentUser()
  if (!user) return []

  if (user.role === 'ADMIN') {
    return prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, nameEn: true, nameAr: true, branchCode: true },
      orderBy: { nameEn: 'asc' },
    })
  }

  if (user.branchIds.length === 0) return []

  return prisma.branch.findMany({
    where: { id: { in: user.branchIds }, isActive: true },
    select: { id: true, nameEn: true, nameAr: true, branchCode: true },
    orderBy: { nameEn: 'asc' },
  })
}

/**
 * Resolves { branches, activeBranchId, activeBranch } for the current request.
 *
 * The active branch is read from a cookie and re-validated against the
 * user's accessible branches on every call — the cookie is only a UX
 * convenience, never a trust boundary. If the cookie is missing, stale,
 * or points to a branch the user no longer has access to, we fall back to
 * the user's primary branch (or the first accessible branch).
 */
export async function resolveActiveBranch() {
  const user = await getCurrentUser()
  const branches = await getAccessibleBranches()

  if (!user || branches.length === 0) {
    return { branches, activeBranchId: null, activeBranch: null }
  }

  const cookieStore = await cookies()
  const requestedId = cookieStore.get(ACTIVE_BRANCH_COOKIE)?.value

  const requested = requestedId
    ? branches.find(branch => branch.id === requestedId)
    : undefined

  let fallback = branches[0]

  if (!requested && user.role !== 'ADMIN') {
    const primary = await prisma.userBranch.findFirst({
      where: { userId: user.id, isPrimary: true },
      select: { branchId: true },
    })
    const primaryBranch = branches.find(branch => branch.id === primary?.branchId)
    if (primaryBranch) fallback = primaryBranch
  }

  const activeBranch = requested ?? fallback

  return {
    branches,
    activeBranchId: activeBranch.id,
    activeBranch,
  }
}
