'use client'

import { useState, useTransition } from 'react'
import { activateUser, deactivateUser } from '@/app/actions/user.actions'

type Role = 'ADMIN' | 'MANAGER' | 'CASHIER'

type Branch = {
  id: string
  nameEn: string
}

type PendingUser = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

export default function PendingUserRow({
  user,
  branches,
}: {
  user: PendingUser
  branches: Branch[]
}) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const [role, setRole] = useState<Role>(user.role)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggleBranch(branchId: string) {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId],
    )
  }

  function handleActivate() {
    setError(null)
    startTransition(async () => {
      const result = await activateUser(user.id, selectedBranches, role)
      if (!result.success) {
        setError(result.error ?? 'Failed to activate user')
      }
    })
  }

  function handleReject() {
    setError(null)
    startTransition(async () => {
      const result = await deactivateUser(user.id)
      if (!result.success) {
        setError(result.error ?? 'Failed to reject user')
      }
    })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
        >
          <option value="CASHIER">Cashier</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium uppercase text-gray-400">
          Assign branch access
        </p>
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => toggleBranch(branch.id)}
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                selectedBranches.includes(branch.id)
                  ? 'bg-amber-500 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {branch.nameEn}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={handleActivate}
          disabled={isPending || selectedBranches.length === 0}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-600 disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Activate'}
        </button>
      </div>
    </div>
  )
}
