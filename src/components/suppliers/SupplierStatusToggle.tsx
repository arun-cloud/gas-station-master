'use client'

import { useState, useTransition } from 'react'
import { setSupplierActive } from '@/app/actions/supplier.actions'

export default function SupplierStatusToggle({
  supplierId,
  isActive,
}: {
  supplierId: string
  isActive: boolean
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    setError(null)
    startTransition(async () => {
      const result = await setSupplierActive(supplierId, !isActive)
      if (!result.success) setError(result.error ?? 'Failed to update status')
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={toggle}
        className={`rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
      >
        {isPending ? 'Updating...' : isActive ? 'Active' : 'Inactive'}
      </button>
      {error ? <span className="max-w-40 text-right text-[11px] text-red-600">{error}</span> : null}
    </div>
  )
}
