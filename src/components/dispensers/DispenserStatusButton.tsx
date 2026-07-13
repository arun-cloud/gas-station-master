'use client'

import { useState, useTransition } from 'react'
import { ChevronDown } from 'lucide-react'
import { updateDispenserStatus } from '@/app/actions/dispenser.actions'

type DispenserStatus = 'IDLE' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE'

type DispenserStatusButtonProps = {
  dispenserId: string
  currentStatus: DispenserStatus
}

const statusConfig: Record<DispenserStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700' },
  IDLE: { label: 'Idle', color: 'bg-gray-100 text-gray-600' },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
  OFFLINE: { label: 'Offline', color: 'bg-red-100 text-red-600' },
}

export default function DispenserStatusButton({
  dispenserId,
  currentStatus,
}: DispenserStatusButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleStatusChange(newStatus: DispenserStatus) {
    setOpen(false)
    setError(null)
    startTransition(async () => {
      const result = await updateDispenserStatus(dispenserId, newStatus)
      if (!result.success) {
        setError(result.error ?? 'Failed to update status')
      }
    })
  }

  const config = statusConfig[currentStatus]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        disabled={isPending}
        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-60 ${config.color}`}
      >
        {config.label}
        <ChevronDown size={12} />
      </button>

      {open ? (
        <div className="absolute right-0 z-10 mt-1 w-36 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {(Object.keys(statusConfig) as DispenserStatus[]).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusChange(status)}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${
                status === currentStatus ? 'font-semibold text-gray-800' : 'text-gray-600'
              }`}
            >
              {statusConfig[status].label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
