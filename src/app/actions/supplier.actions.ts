'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '../../../prisma/generated/client'
import { ForbiddenError, requireRole } from '@/lib/rbac'
import { getAccessibleBranches } from '@/lib/branch-context'
import {
  createSupplierRecord,
  findSupplierById,
  updateSupplierRecord,
} from '@/lib/repositories/supplier-repository'
import { supplierInputSchema } from '@/lib/validation/supplier.schema'

export type SupplierActionResult = {
  success: boolean
  error?: string
}

function readSupplierForm(formData: FormData) {
  return supplierInputSchema.safeParse({
    supplierCode: formData.get('supplierCode'),
    nameEn: formData.get('nameEn'),
    nameAr: formData.get('nameAr'),
    legalName: formData.get('legalName'),
    type: formData.get('type'),
    vatNumber: formData.get('vatNumber'),
    crNumber: formData.get('crNumber'),
    contactName: formData.get('contactName'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    city: formData.get('city'),
    paymentTermsDays: formData.get('paymentTermsDays') ?? 0,
    creditLimit: formData.get('creditLimit') ?? 0,
    notes: formData.get('notes'),
    branchIds: formData.getAll('branchIds').map(String),
  })
}

async function getAccessibleBranchIdSet() {
  const accessible = await getAccessibleBranches()
  return new Set(accessible.map(branch => branch.id))
}

export async function createSupplier(formData: FormData): Promise<SupplierActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    const parsed = readSupplierForm(formData)

    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid supplier information',
      }
    }

    const accessibleBranchIds = await getAccessibleBranchIdSet()
    if (!parsed.data.branchIds.every(branchId => accessibleBranchIds.has(branchId))) {
      return { success: false, error: 'One or more selected branches are not accessible' }
    }

    const { branchIds, ...fields } = parsed.data

    await createSupplierRecord({
      ...fields,
      name: fields.nameEn,
      createdBy: actor.id,
      branches: {
        create: branchIds.map(branchId => ({
          branch: { connect: { id: branchId } },
        })),
      },
    })

    revalidatePath('/suppliers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(',') : ''
      if (target.includes('vatNumber')) {
        return { success: false, error: 'A supplier with this VAT number already exists' }
      }
      if (target.includes('crNumber')) {
        return { success: false, error: 'A supplier with this CR number already exists' }
      }
      return { success: false, error: 'A supplier with this code already exists' }
    }

    console.error('Failed to create supplier:', error)
    return { success: false, error: 'Failed to create supplier' }
  }
}

export async function updateSupplier(
  supplierId: string,
  formData: FormData,
): Promise<SupplierActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    const existing = await findSupplierById(supplierId)

    if (!existing) {
      return { success: false, error: 'Supplier not found' }
    }

    const parsed = readSupplierForm(formData)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid supplier information',
      }
    }

    const accessibleBranchIds = await getAccessibleBranchIdSet()
    if (!parsed.data.branchIds.every(branchId => accessibleBranchIds.has(branchId))) {
      return { success: false, error: 'One or more selected branches are not accessible' }
    }

    const { branchIds: submittedBranchIds, ...fields } = parsed.data
    const preservedInaccessibleBranchIds =
      actor.role === 'ADMIN'
        ? []
        : existing.branches
            .map(item => item.branchId)
            .filter(branchId => !accessibleBranchIds.has(branchId))
    const branchIds = [...new Set([...preservedInaccessibleBranchIds, ...submittedBranchIds])]

    await updateSupplierRecord(supplierId, {
      ...fields,
      name: fields.nameEn,
      updatedBy: actor.id,
      branches: {
        deleteMany: {},
        create: branchIds.map(branchId => ({
          branch: { connect: { id: branchId } },
        })),
      },
    })

    revalidatePath('/suppliers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false, error: 'Supplier code, VAT number or CR number already exists' }
    }

    console.error('Failed to update supplier:', error)
    return { success: false, error: 'Failed to update supplier' }
  }
}

export async function setSupplierActive(
  supplierId: string,
  isActive: boolean,
): Promise<SupplierActionResult> {
  try {
    const actor = await requireRole(['ADMIN', 'MANAGER'])
    const existing = await findSupplierById(supplierId)

    if (!existing) {
      return { success: false, error: 'Supplier not found' }
    }

    await updateSupplierRecord(supplierId, {
      isActive,
      updatedBy: actor.id,
    })

    revalidatePath('/suppliers')
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof ForbiddenError) {
      return { success: false, error: error.message }
    }

    console.error('Failed to update supplier status:', error)
    return { success: false, error: 'Failed to update supplier status' }
  }
}
