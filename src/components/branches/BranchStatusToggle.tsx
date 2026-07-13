'use client'

import { useState, useTransition } from 'react'
import { Ban, CheckCircle2 } from 'lucide-react'
import { setBranchActive } from '@/app/actions/branch.actions'

type BranchStatusToggleProps = {
  branchId: string
  isActive: boolean
}

export default function BranchStatusToggle({
  branchId,
  isActive,
}: BranchStatusToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    const nextValue = !isActive

    const confirmed = nextValue
      ? true
      : window.confirm(
          'Disable this branch? Users assigned to it will lose access and it will no longer appear in switchers. Historical data is preserved.',
        )

    if (!confirmed) return

    startTransition(async () => {
      const result = await setBranchActive(branchId, nextValue)
      if (!result.success) {
        setError(result.error ?? 'Failed to update branch status')
      }
    })
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        title={isActive ? 'Disable branch' : 'Enable branch'}
        className={`rounded-lg p-2 hover:bg-gray-100 disabled:opacity-60 ${
          isActive ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
        }`}
      >
        {isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
      </button>
      {error ? (
        <span className="mt-0.5 text-xs text-red-500">{error}</span>
      ) : null}
    </div>
  )
}
