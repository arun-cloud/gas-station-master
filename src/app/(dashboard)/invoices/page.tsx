import { Building2, PlugZap } from 'lucide-react'
import { Suspense } from 'react'
import { requireUser } from '@/lib/rbac'
import { resolveActiveBranch } from '@/lib/branch-context'
import { prisma } from '@/lib/prisma'
import { searchInvoices } from '@/lib/services/invoice-service'
import { invoiceSearchParamsSchema, toInvoiceFilters } from '@/lib/validation/invoice.schema'
import InvoiceFilters from '@/components/invoices/InvoiceFilters'
import InvoicesTable from '@/components/invoices/InvoicesTable'
import InvoicesPagination from '@/components/invoices/InvoicesPagination'
import SyncNowButton from '@/components/invoices/SyncNowButton'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function InvoicesPage({ searchParams }: PageProps) {
  const user = await requireUser()
  const { activeBranch } = await resolveActiveBranch()

  // Permission state: signed in, but no accessible branch yet.
  if (!activeBranch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Building2 size={24} className="mb-2 text-amber-600" />
        <h1 className="text-lg font-semibold text-amber-900">No branch access</h1>
        <p className="mt-1 text-sm text-amber-700">
          You don&apos;t have access to any active branch yet. Contact an administrator to be
          assigned to a branch.
        </p>
      </div>
    )
  }

  const connection = await prisma.loyverseConnection.findUnique({
    where: { branchId: activeBranch.id },
    select: { status: true, storeName: true },
  })

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  // Empty/setup state: branch has no Loyverse store connected yet.
  if (!connection || connection.status !== 'CONNECTED') {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <PlugZap size={36} className="mx-auto mb-3 text-gray-300" />
        <h1 className="text-lg font-semibold text-gray-800">Loyverse isn&apos;t connected yet</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          {canManage
            ? 'Connect this branch to Loyverse from Settings to start syncing invoices.'
            : 'Ask an administrator or manager to connect this branch to Loyverse.'}
        </p>
        {canManage ? (
          <a
            href="/settings"
            className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Go to Settings
          </a>
        ) : null}
      </div>
    )
  }

  const rawParams = await searchParams
  const singleValueParams = Object.fromEntries(
    Object.entries(rawParams).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]),
  )
  const parsedParams = invoiceSearchParamsSchema.safeParse(singleValueParams)
  const filters = toInvoiceFilters(parsedParams.success ? parsedParams.data : {})

  const { invoices, total, page, pageSize } = await searchInvoices(filters)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {total} invoice{total === 1 ? '' : 's'} · {activeBranch.nameEn}
            {connection.storeName ? ` · Loyverse: ${connection.storeName}` : ''}
          </p>
        </div>
        {canManage ? <SyncNowButton /> : null}
      </div>

      <Suspense fallback={<div className="h-[76px] rounded-xl border border-gray-200 bg-gray-50" />}>
        <InvoiceFilters />
      </Suspense>

      <InvoicesTable invoices={invoices} />

      <InvoicesPagination
        page={page}
        pageSize={pageSize}
        total={total}
        searchParams={singleValueParams}
      />
    </div>
  )
}
