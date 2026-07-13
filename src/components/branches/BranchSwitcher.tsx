'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronDown } from 'lucide-react'
import { setActiveBranch } from '@/app/actions/branch.actions'

type Branch = {
  id: string
  nameEn: string
  branchCode: string
}

type BranchSwitcherProps = {
  branches: Branch[]
  activeBranchId: string | null
}

export default function BranchSwitcher({
  branches,
  activeBranchId,
}: BranchSwitcherProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (branches.length === 0) {
    return (
      <span className="text-xs text-gray-400">No branch access</span>
    )
  }

  // Single-branch users don't need a switcher — just show where they are.
  if (branches.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Building2 size={16} className="text-gray-400" />
        <span>{branches[0].nameEn}</span>
      </div>
    )
  }

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const branchId = event.target.value
    setError(null)

    startTransition(async () => {
      const result = await setActiveBranch(branchId)
      if (!result.success) {
        setError(result.error ?? 'Failed to switch branch')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col">
      <div className="relative flex items-center gap-2">
        <Building2 size={16} className="text-gray-400 shrink-0" />
        <select
          value={activeBranchId ?? ''}
          onChange={handleChange}
          disabled={isPending}
          className="appearance-none rounded-lg border-0 bg-gray-100 py-2 pl-2 pr-7 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
        >
          {branches.map(branch => (
            <option key={branch.id} value={branch.id}>
              {branch.nameEn} ({branch.branchCode})
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 text-gray-400"
        />
      </div>
      {error ? (
        <span className="mt-0.5 text-xs text-red-500">{error}</span>
      ) : null}
    </div>
  )
}
