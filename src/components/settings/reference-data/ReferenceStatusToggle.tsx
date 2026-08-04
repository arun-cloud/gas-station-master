'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  setReferenceCategoryActive,
  setReferenceValueActive,
} from '@/app/actions/reference-data.actions'

type Props = {
  recordType: 'category' | 'value'
  recordId: string
  isActive: boolean
  isSystem: boolean
}

export default function ReferenceStatusToggle({
  recordType,
  recordId,
  isActive,
  isSystem,
}: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (isSystem) {
    return (
      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
        System
      </span>
    )
  }

  function toggle() {
    setError(null)

    startTransition(async () => {
      const result =
        recordType === 'category'
          ? await setReferenceCategoryActive(recordId, !isActive)
          : await setReferenceValueActive(recordId, !isActive)

      if (!result.success) {
        setError(result.error ?? 'Failed to update status')
        return
      }

      router.refresh()
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
      {error ? <span className="max-w-52 text-right text-[11px] text-red-600">{error}</span> : null}
    </div>
  )
}
