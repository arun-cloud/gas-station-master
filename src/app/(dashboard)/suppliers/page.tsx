import { Building2 } from 'lucide-react'
import { Suspense } from 'react'
import { requireUser } from '@/lib/rbac'
import { getAccessibleBranches, resolveActiveBranch } from '@/lib/branch-context'
import { searchSuppliers } from '@/lib/services/supplier-service'
import {
  supplierSearchParamsSchema,
  toSupplierFilters,
} from '@/lib/validation/supplier.schema'
import SupplierForm from '@/components/suppliers/SupplierForm'
import SupplierFilters from '@/components/suppliers/SupplierFilters'
import SuppliersTable from '@/components/suppliers/SuppliersTable'
import SuppliersPagination from '@/components/suppliers/SuppliersPagination'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SuppliersPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Building2 size={24} className="mb-2 text-amber-600" />
        <h1 className="text-lg font-semibold text-amber-900">No branch access</h1>
        <p className="mt-1 text-sm text-amber-700">
          You do not have access to an active branch. Contact an administrator.
        </p>
      </div>
    )
  }

  const rawParams = await searchParams
  const singleValueParams = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value,
    ]),
  )
  const parsed = supplierSearchParamsSchema.safeParse(singleValueParams)
  const filters = toSupplierFilters(parsed.success ? parsed.data : {})

  const [result, branches] = await Promise.all([
    searchSuppliers(filters),
    getAccessibleBranches(),
  ])

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {result.total} supplier{result.total === 1 ? '' : 's'} · {activeBranch.nameEn}
          </p>
        </div>
        {canManage ? <SupplierForm mode="create" branches={branches} /> : null}
      </div>

      <Suspense fallback={<div className="h-20 rounded-xl border border-gray-200 bg-gray-50" />}>
        <SupplierFilters />
      </Suspense>

      <SuppliersTable suppliers={result.suppliers} branches={branches} canManage={canManage} />

      <SuppliersPagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={singleValueParams}
      />
    </div>
  )
}
