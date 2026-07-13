'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireRole, requireBranchAccess, ForbiddenError } from '@/lib/rbac'
import { Prisma } from '../../../prisma/generated/client'
import { ACTIVE_BRANCH_COOKIE } from '@/lib/branch-context'

export type BranchActionResult = {
  success: boolean
  error?: string
}

type BranchFields = {
  nameEn: string
  nameAr: string
  branchCode: string
  buildingNo: string
  street: string
  district: string
  city: string
  postalCode: string
}

function readBranchFields(formData: FormData): BranchFields | { error: string } {
  const nameEn = String(formData.get('nameEn') ?? '').trim()
  const nameAr = String(formData.get('nameAr') ?? '').trim()
  const branchCode = String(formData.get('branchCode') ?? '').trim().toUpperCase()
  const buildingNo = String(formData.get('buildingNo') ?? '').trim()
  const street = String(formData.get('street') ?? '').trim()
  const district = String(formData.get('district') ?? '').trim()
  const city = String(formData.get('city') ?? '').trim()
  const postalCode = String(formData.get('postalCode') ?? '').trim()

  if (!nameEn || !nameAr || !branchCode) {
    return { error: 'Branch name (English/Arabic) and branch code are required' }
  }

  if (!/^[A-Z0-9-]{2,20}$/.test(branchCode)) {
    return { error: 'Branch code must be 2-20 characters: letters, numbers, and hyphens only' }
  }

  if (!buildingNo || !street || !district || !city || !postalCode) {
    return { error: 'Complete National Address fields are required (building, street, district, city, postal code)' }
  }

  return { nameEn, nameAr, branchCode, buildingNo, street, district, city, postalCode }
}

// ── Create a branch (ADMIN only) ──────────────────────────
export async function createBranch(formData: FormData): Promise<BranchActionResult> {
  try {
    const actor = await requireRole(['ADMIN'])

    const fields = readBranchFields(formData)
    if ('error' in fields) return { success: false, error: fields.error }

    const company = await prisma.company.findFirst({ select: { id: true } })
    if (!company) {
      return { success: false, error: 'No company record exists. Configure the company profile first.' }
    }

    await prisma.branch.create({
      data: {
        ...fields,
        companyId: company.id,
        createdBy: actor.id,
      },
    })

    revalidatePath('/admin/branches')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A branch with this branch code already exists' }
    }
    console.error('Failed to create branch:', error)
    return { success: false, error: 'Failed to create branch' }
  }
}

// ── Update a branch (ADMIN only) ──────────────────────────
export async function updateBranch(
  branchId: string,
  formData: FormData,
): Promise<BranchActionResult> {
  try {
    const actor = await requireRole(['ADMIN'])

    if (!branchId) return { success: false, error: 'Branch ID is required' }

    const fields = readBranchFields(formData)
    if ('error' in fields) return { success: false, error: fields.error }

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        ...fields,
        updatedBy: actor.id,
      },
    })

    revalidatePath('/admin/branches')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'A branch with this branch code already exists' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false, error: 'Branch not found' }
    }
    console.error('Failed to update branch:', error)
    return { success: false, error: 'Failed to update branch' }
  }
}

// ── Activate / deactivate a branch (ADMIN only) ───────────
// Branches are soft-disabled rather than deleted: historical sales, shifts,
// tanks and dispensers must keep a valid foreign key for audit/reporting.
export async function setBranchActive(
  branchId: string,
  isActive: boolean,
): Promise<BranchActionResult> {
  try {
    const actor = await requireRole(['ADMIN'])

    await prisma.branch.update({
      where: { id: branchId },
      data: { isActive, updatedBy: actor.id },
    })

    revalidatePath('/admin/branches')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to update branch status:', error)
    return { success: false, error: 'Failed to update branch status' }
  }
}

// ── Switch the active branch (any authenticated user) ─────
// The cookie is a UX convenience only; every read of it elsewhere is
// re-validated against the user's accessible branches (see branch-context.ts),
// so a tampered cookie value can't grant access to an unauthorized branch.
export async function setActiveBranch(branchId: string): Promise<BranchActionResult> {
  try {
    await requireBranchAccess(branchId)

    const cookieStore = await cookies()
    cookieStore.set(ACTIVE_BRANCH_COOKIE, branchId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }
    console.error('Failed to switch branch:', error)
    return { success: false, error: 'Failed to switch branch' }
  }
}
