'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '../../../prisma/generated/client'
import { ForbiddenError, requireRole } from '@/lib/rbac'
import {
  createReferenceCategoryRecord,
  createReferenceValueRecord,
  findReferenceCategoryForCompany,
  findReferenceValueForCompany,
  setReferenceCategoryActiveRecord,
  setReferenceValueActiveRecord,
  updateReferenceCategoryRecord,
  updateReferenceValueRecord,
} from '@/lib/repositories/reference-data-repository'
import { resolveReferenceDataCompanyContext } from '@/lib/services/reference-data-service'
import {
  referenceCategoryInputSchema,
  referenceRecordIdSchema,
  referenceValueInputSchema,
} from '@/lib/validation/reference-data.schema'

const REFERENCE_DATA_PATH = '/settings/master-data/reference-data'

export type ReferenceDataActionResult = {
  success: boolean
  error?: string
  entityId?: string
}

async function getAuthorizedContext() {
  const actor = await requireRole(['ADMIN', 'MANAGER'])
  const context = await resolveReferenceDataCompanyContext()

  if (!context) {
    throw new ForbiddenError('An active branch and company are required')
  }

  return {
    actor,
    companyId: context.company.id,
  }
}

function readCategoryForm(formData: FormData) {
  return referenceCategoryInputSchema.safeParse({
    code: formData.get('code'),
    nameEn: formData.get('nameEn'),
    nameAr: formData.get('nameAr'),
    description: formData.get('description'),
  })
}

function readValueForm(formData: FormData) {
  return referenceValueInputSchema.safeParse({
    code: formData.get('code'),
    nameEn: formData.get('nameEn'),
    nameAr: formData.get('nameAr'),
    description: formData.get('description'),
    displayOrder: formData.get('displayOrder') ?? 0,
    isDefault: formData.get('isDefault') === 'on',
  })
}

function validationError(message?: string): ReferenceDataActionResult {
  return {
    success: false,
    error: message ?? 'Invalid reference data',
  }
}

function handleActionError(error: unknown, fallback: string): ReferenceDataActionResult {
  if (error instanceof ForbiddenError) {
    return { success: false, error: error.message }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return {
      success: false,
      error: 'The code already exists in this company or category',
    }
  }

  console.error(fallback, error)
  return { success: false, error: fallback }
}

export async function createReferenceCategory(
  formData: FormData,
): Promise<ReferenceDataActionResult> {
  try {
    const { actor, companyId } = await getAuthorizedContext()
    const parsed = readCategoryForm(formData)

    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message)
    }

    const category = await createReferenceCategoryRecord(companyId, parsed.data, actor.id)
    revalidatePath(REFERENCE_DATA_PATH)

    return {
      success: true,
      entityId: category.id,
    }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to create reference category')
  }
}

export async function updateReferenceCategory(
  categoryId: string,
  formData: FormData,
): Promise<ReferenceDataActionResult> {
  try {
    const parsedId = referenceRecordIdSchema.safeParse(categoryId)
    if (!parsedId.success) return validationError('Invalid reference category')

    const { actor, companyId } = await getAuthorizedContext()
    const existing = await findReferenceCategoryForCompany(parsedId.data, companyId)

    if (!existing) return validationError('Reference category not found')
    if (existing.isSystem) {
      return validationError('System reference categories cannot be edited')
    }

    const parsed = readCategoryForm(formData)
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message)
    }

    await updateReferenceCategoryRecord(existing.id, parsed.data, actor.id)
    revalidatePath(REFERENCE_DATA_PATH)

    return { success: true, entityId: existing.id }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to update reference category')
  }
}

export async function setReferenceCategoryActive(
  categoryId: string,
  isActive: boolean,
): Promise<ReferenceDataActionResult> {
  try {
    const parsedId = referenceRecordIdSchema.safeParse(categoryId)
    if (!parsedId.success || typeof isActive !== 'boolean') {
      return validationError('Invalid category status request')
    }

    const { actor, companyId } = await getAuthorizedContext()
    const existing = await findReferenceCategoryForCompany(parsedId.data, companyId)

    if (!existing) return validationError('Reference category not found')
    if (existing.isSystem) {
      return validationError('System reference categories cannot be disabled')
    }

    await setReferenceCategoryActiveRecord(existing.id, isActive, actor.id)
    revalidatePath(REFERENCE_DATA_PATH)

    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to update reference category status')
  }
}

export async function createReferenceValue(
  categoryId: string,
  formData: FormData,
): Promise<ReferenceDataActionResult> {
  try {
    const parsedId = referenceRecordIdSchema.safeParse(categoryId)
    if (!parsedId.success) return validationError('Invalid reference category')

    const { actor, companyId } = await getAuthorizedContext()
    const category = await findReferenceCategoryForCompany(parsedId.data, companyId)

    if (!category) return validationError('Reference category not found')
    if (!category.isActive) {
      return validationError('Activate the category before adding values')
    }

    const parsed = readValueForm(formData)
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message)
    }

    const value = await createReferenceValueRecord(category.id, parsed.data, actor.id)
    revalidatePath(REFERENCE_DATA_PATH)

    return { success: true, entityId: value.id }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to create reference value')
  }
}

export async function updateReferenceValue(
  valueId: string,
  formData: FormData,
): Promise<ReferenceDataActionResult> {
  try {
    const parsedId = referenceRecordIdSchema.safeParse(valueId)
    if (!parsedId.success) return validationError('Invalid reference value')

    const { actor, companyId } = await getAuthorizedContext()
    const existing = await findReferenceValueForCompany(parsedId.data, companyId)

    if (!existing) return validationError('Reference value not found')
    if (existing.isSystem) {
      return validationError('System reference values cannot be edited')
    }

    const parsed = readValueForm(formData)
    if (!parsed.success) {
      return validationError(parsed.error.issues[0]?.message)
    }

    await updateReferenceValueRecord(
      existing.id,
      existing.categoryId,
      parsed.data,
      existing.isActive,
      actor.id,
    )
    revalidatePath(REFERENCE_DATA_PATH)

    return { success: true, entityId: existing.id }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to update reference value')
  }
}

export async function setReferenceValueActive(
  valueId: string,
  isActive: boolean,
): Promise<ReferenceDataActionResult> {
  try {
    const parsedId = referenceRecordIdSchema.safeParse(valueId)
    if (!parsedId.success || typeof isActive !== 'boolean') {
      return validationError('Invalid value status request')
    }

    const { actor, companyId } = await getAuthorizedContext()
    const existing = await findReferenceValueForCompany(parsedId.data, companyId)

    if (!existing) return validationError('Reference value not found')
    if (existing.isSystem) {
      return validationError('System reference values cannot be disabled')
    }

    await setReferenceValueActiveRecord(existing.id, isActive, actor.id)
    revalidatePath(REFERENCE_DATA_PATH)

    return { success: true }
  } catch (error: unknown) {
    return handleActionError(error, 'Failed to update reference value status')
  }
}
