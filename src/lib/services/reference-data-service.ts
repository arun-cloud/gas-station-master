import 'server-only'

import { resolveActiveBranch } from '@/lib/branch-context'
import {
  findCompanyForBranch,
  findReferenceCategories,
  findReferenceCategoryWithValues,
} from '@/lib/repositories/reference-data-repository'
import type {
  ReferenceDataCategoryDetailDto,
  ReferenceDataCategoryDto,
  ReferenceDataPageData,
} from '@/lib/reference-data/types'

export async function resolveReferenceDataCompanyContext() {
  const { activeBranch } = await resolveActiveBranch()
  if (!activeBranch) return null

  const branch = await findCompanyForBranch(activeBranch.id)
  if (!branch) return null

  return {
    activeBranchId: activeBranch.id,
    company: branch.company,
  }
}

export async function getReferenceDataPageData(
  requestedCategoryId?: string,
): Promise<ReferenceDataPageData> {
  const context = await resolveReferenceDataCompanyContext()

  if (!context) {
    return {
      company: null,
      categories: [],
      selectedCategory: null,
    }
  }

  const rows = await findReferenceCategories(context.company.id)
  const categories: ReferenceDataCategoryDto[] = rows.map(category => ({
    id: category.id,
    companyId: category.companyId,
    code: category.code,
    nameEn: category.nameEn,
    nameAr: category.nameAr,
    description: category.description,
    isSystem: category.isSystem,
    isActive: category.isActive,
    valueCount: category._count.values,
  }))

  const requestedCategory = requestedCategoryId
    ? categories.find(category => category.id === requestedCategoryId)
    : undefined
  const selectedCategoryId = requestedCategory?.id ?? categories[0]?.id

  let selectedCategory: ReferenceDataCategoryDetailDto | null = null

  if (selectedCategoryId) {
    const category = await findReferenceCategoryWithValues(
      selectedCategoryId,
      context.company.id,
    )

    if (category) {
      selectedCategory = {
        id: category.id,
        companyId: category.companyId,
        code: category.code,
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        description: category.description,
        isSystem: category.isSystem,
        isActive: category.isActive,
        valueCount: category._count.values,
        values: category.values.map(value => ({
          id: value.id,
          categoryId: value.categoryId,
          code: value.code,
          nameEn: value.nameEn,
          nameAr: value.nameAr,
          description: value.description,
          displayOrder: value.displayOrder,
          isDefault: value.isDefault,
          isSystem: value.isSystem,
          isActive: value.isActive,
        })),
      }
    }
  }

  return {
    company: context.company,
    categories,
    selectedCategory,
  }
}
