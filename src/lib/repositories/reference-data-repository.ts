import 'server-only'

import { prisma } from '@/lib/prisma'
import type {
  ReferenceCategoryInput,
  ReferenceValueInput,
} from '@/lib/validation/reference-data.schema'

export async function findCompanyForBranch(branchId: string) {
  return prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      company: {
        select: {
          id: true,
          nameEn: true,
        },
      },
    },
  })
}

export async function findReferenceCategories(companyId: string) {
  return prisma.referenceDataCategory.findMany({
    where: { companyId },
    orderBy: [{ isActive: 'desc' }, { nameEn: 'asc' }],
    include: {
      _count: {
        select: { values: true },
      },
    },
  })
}

export async function findReferenceCategoryWithValues(
  categoryId: string,
  companyId: string,
) {
  return prisma.referenceDataCategory.findFirst({
    where: {
      id: categoryId,
      companyId,
    },
    include: {
      values: {
        orderBy: [{ displayOrder: 'asc' }, { nameEn: 'asc' }],
      },
      _count: {
        select: { values: true },
      },
    },
  })
}

export async function findReferenceCategoryForCompany(
  categoryId: string,
  companyId: string,
) {
  return prisma.referenceDataCategory.findFirst({
    where: {
      id: categoryId,
      companyId,
    },
  })
}

export async function findReferenceValueForCompany(valueId: string, companyId: string) {
  return prisma.referenceDataValue.findFirst({
    where: {
      id: valueId,
      category: { companyId },
    },
    include: {
      category: {
        select: {
          id: true,
          companyId: true,
          isActive: true,
        },
      },
    },
  })
}

export async function createReferenceCategoryRecord(
  companyId: string,
  data: ReferenceCategoryInput,
  actorId: string,
) {
  return prisma.referenceDataCategory.create({
    data: {
      companyId,
      code: data.code,
      nameEn: data.nameEn,
      nameAr: data.nameAr ?? null,
      description: data.description ?? null,
      createdBy: actorId,
    },
  })
}

export async function updateReferenceCategoryRecord(
  categoryId: string,
  data: ReferenceCategoryInput,
  actorId: string,
) {
  return prisma.referenceDataCategory.update({
    where: { id: categoryId },
    data: {
      code: data.code,
      nameEn: data.nameEn,
      nameAr: data.nameAr ?? null,
      description: data.description ?? null,
      updatedBy: actorId,
    },
  })
}

export async function setReferenceCategoryActiveRecord(
  categoryId: string,
  isActive: boolean,
  actorId: string,
) {
  return prisma.referenceDataCategory.update({
    where: { id: categoryId },
    data: {
      isActive,
      updatedBy: actorId,
    },
  })
}

export async function createReferenceValueRecord(
  categoryId: string,
  data: ReferenceValueInput,
  actorId: string,
) {
  return prisma.$transaction(async transaction => {
    if (data.isDefault) {
      await transaction.referenceDataValue.updateMany({
        where: {
          categoryId,
          isDefault: true,
        },
        data: {
          isDefault: false,
          updatedBy: actorId,
        },
      })
    }

    return transaction.referenceDataValue.create({
      data: {
        categoryId,
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr ?? null,
        description: data.description ?? null,
        displayOrder: data.displayOrder,
        isDefault: data.isDefault,
        createdBy: actorId,
      },
    })
  })
}

export async function updateReferenceValueRecord(
  valueId: string,
  categoryId: string,
  data: ReferenceValueInput,
  currentIsActive: boolean,
  actorId: string,
) {
  return prisma.$transaction(async transaction => {
    const isDefault = currentIsActive && data.isDefault

    if (isDefault) {
      await transaction.referenceDataValue.updateMany({
        where: {
          categoryId,
          id: { not: valueId },
          isDefault: true,
        },
        data: {
          isDefault: false,
          updatedBy: actorId,
        },
      })
    }

    return transaction.referenceDataValue.update({
      where: { id: valueId },
      data: {
        code: data.code,
        nameEn: data.nameEn,
        nameAr: data.nameAr ?? null,
        description: data.description ?? null,
        displayOrder: data.displayOrder,
        isDefault,
        updatedBy: actorId,
      },
    })
  })
}

export async function setReferenceValueActiveRecord(
  valueId: string,
  isActive: boolean,
  actorId: string,
) {
  return prisma.referenceDataValue.update({
    where: { id: valueId },
    data: {
      isActive,
      ...(isActive ? {} : { isDefault: false }),
      updatedBy: actorId,
    },
  })
}
