'use client'

import { useSearchParams } from 'next/navigation'

const types = ['ALL', 'FUEL', 'PRODUCT', 'SERVICE', 'UTILITY', 'GOVERNMENT', 'OTHER']

export default function SupplierFilters() {
  const searchParams = useSearchParams()

  return (
    <form className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-[1fr_180px_160px_auto]">
      <input
        name="q"
        defaultValue={searchParams.get('q') ?? ''}
        placeholder="Search code, name, VAT, CR or phone"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <select
        name="type"
        defaultValue={searchParams.get('type') ?? 'ALL'}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        {types.map(type => (
          <option key={type} value={type}>
            {type === 'ALL' ? 'All types' : type.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={searchParams.get('status') ?? 'ALL'}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
      >
        <option value="ALL">All statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Apply
      </button>
    </form>
  )
}
