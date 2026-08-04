import Link from 'next/link'
import { ArrowLeft, Building2, Tags } from 'lucide-react'
import ReferenceDataManager from '@/components/settings/reference-data/ReferenceDataManager'
import { requireUser } from '@/lib/rbac'
import { getReferenceDataPageData } from '@/lib/services/reference-data-service'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ReferenceDataPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const params = await searchParams
  const requestedCategory = Array.isArray(params.category)
    ? params.category[0]
    : params.category
  const data = await getReferenceDataPageData(requestedCategory)

  if (!data.company) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Building2 size={24} className="mb-2 text-amber-600" />
        <h1 className="text-lg font-semibold text-amber-900">No company context</h1>
        <p className="mt-1 text-sm text-amber-700">
          You need access to an active branch before company reference data can be managed.
        </p>
      </div>
    )
  }

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>

        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <Tags size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Reference Data</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage company-wide reusable codes and lookup values for {data.company.nameEn}.
            </p>
          </div>
        </div>
      </div>

      <ReferenceDataManager
        categories={data.categories}
        selectedCategory={data.selectedCategory}
        canManage={canManage}
      />
    </div>
  )
}
