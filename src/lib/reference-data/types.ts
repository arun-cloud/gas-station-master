export type ReferenceDataValueDto = {
  id: string
  categoryId: string
  code: string
  nameEn: string
  nameAr: string | null
  description: string | null
  displayOrder: number
  isDefault: boolean
  isSystem: boolean
  isActive: boolean
}

export type ReferenceDataCategoryDto = {
  id: string
  companyId: string
  code: string
  nameEn: string
  nameAr: string | null
  description: string | null
  isSystem: boolean
  isActive: boolean
  valueCount: number
}

export type ReferenceDataCategoryDetailDto = ReferenceDataCategoryDto & {
  values: ReferenceDataValueDto[]
}

export type ReferenceDataPageData = {
  company: {
    id: string
    nameEn: string
  } | null
  categories: ReferenceDataCategoryDto[]
  selectedCategory: ReferenceDataCategoryDetailDto | null
}
