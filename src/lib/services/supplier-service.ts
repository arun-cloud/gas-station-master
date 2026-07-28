import 'server-only'
import { resolveActiveBranch } from '@/lib/branch-context'
import {
  findSuppliers,
  type SupplierRepositoryFilters,
} from '@/lib/repositories/supplier-repository'
import {
  SUPPLIERS_PAGE_SIZE,
  type SupplierFilters,
} from '@/lib/validation/supplier.schema'

export type SupplierListItem = {
  id: string
  supplierCode: string
  nameEn: string
  nameAr: string | null
  legalName: string | null
  type: string
  vatNumber: string | null
  crNumber: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  paymentTermsDays: number
  creditLimit: string
  notes: string | null
  isActive: boolean
  branches: Array<{ id: string; nameEn: string; branchCode: string }>
  purchaseOrderCount: number
  deliveryCount: number
}

export type SupplierSearchResult = {
  suppliers: SupplierListItem[]
  total: number
  page: number
  pageSize: number
}

export async function searchSuppliers(
  filters: SupplierFilters,
): Promise<SupplierSearchResult> {
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return {
      suppliers: [],
      total: 0,
      page: filters.page,
      pageSize: SUPPLIERS_PAGE_SIZE,
    }
  }

  const repositoryFilters: SupplierRepositoryFilters = {
    branchId: activeBranch.id,
    q: filters.q,
    type: filters.type,
    isActive: filters.isActive,
    skip: (filters.page - 1) * SUPPLIERS_PAGE_SIZE,
    take: SUPPLIERS_PAGE_SIZE,
  }

  const [rows, total] = await findSuppliers(repositoryFilters)

  return {
    suppliers: rows.map(supplier => ({
      id: supplier.id,
      supplierCode: supplier.supplierCode,
      nameEn: supplier.nameEn,
      nameAr: supplier.nameAr,
      legalName: supplier.legalName,
      type: supplier.type,
      vatNumber: supplier.vatNumber,
      crNumber: supplier.crNumber,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      city: supplier.city,
      paymentTermsDays: supplier.paymentTermsDays,
      creditLimit: supplier.creditLimit.toFixed(2),
      notes: supplier.notes,
      isActive: supplier.isActive,
      branches: supplier.branches.map(item => item.branch),
      purchaseOrderCount: supplier._count.purchaseOrders,
      deliveryCount: supplier._count.deliveries,
    })),
    total,
    page: filters.page,
    pageSize: SUPPLIERS_PAGE_SIZE,
  }
}
