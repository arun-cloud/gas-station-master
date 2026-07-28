import 'server-only'
import { prisma } from '@/lib/prisma'
import type { Prisma, SupplierType } from '../../../prisma/generated/client'

export type SupplierRepositoryFilters = {
  branchId: string
  q?: string
  type?: SupplierType
  isActive?: boolean
  skip: number
  take: number
}

function buildWhere(filters: SupplierRepositoryFilters): Prisma.SupplierWhereInput {
  return {
    branches: { some: { branchId: filters.branchId } },
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.isActive == null ? {} : { isActive: filters.isActive }),
    ...(filters.q
      ? {
          OR: [
            { supplierCode: { contains: filters.q, mode: 'insensitive' } },
            { nameEn: { contains: filters.q, mode: 'insensitive' } },
            { nameAr: { contains: filters.q, mode: 'insensitive' } },
            { legalName: { contains: filters.q, mode: 'insensitive' } },
            { vatNumber: { contains: filters.q } },
            { crNumber: { contains: filters.q } },
            { phone: { contains: filters.q } },
          ],
        }
      : {}),
  }
}

export async function findSuppliers(filters: SupplierRepositoryFilters) {
  const where = buildWhere(filters)

  return Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: [{ isActive: 'desc' }, { nameEn: 'asc' }],
      skip: filters.skip,
      take: filters.take,
      include: {
        branches: {
          include: {
            branch: {
              select: { id: true, nameEn: true, branchCode: true },
            },
          },
          orderBy: { branch: { nameEn: 'asc' } },
        },
        _count: {
          select: { purchaseOrders: true, deliveries: true },
        },
      },
    }),
    prisma.supplier.count({ where }),
  ])
}

export async function findSupplierById(id: string) {
  return prisma.supplier.findUnique({
    where: { id },
    include: { branches: { select: { branchId: true } } },
  })
}

export async function createSupplierRecord(
  data: Prisma.SupplierCreateInput,
) {
  return prisma.supplier.create({ data })
}

export async function updateSupplierRecord(
  id: string,
  data: Prisma.SupplierUpdateInput,
) {
  return prisma.supplier.update({ where: { id }, data })
}
