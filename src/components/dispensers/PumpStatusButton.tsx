'use client'

import { useState, useTransition } from 'react'
import { updatePumpStatus } from '@/app/actions/pump.actions'
import { ChevronDown } from 'lucide-react'

type PumpStatus = 'IDLE' | 'ACTIVE' | 'MAINTENANCE' | 'OFFLINE'

interface Props {
  pumpId:        string
  currentStatus: PumpStatus
}

const statusConfig: Record<PumpStatus, { label: string; color: string }> = {
  ACTIVE:      { label: 'Active',      color: 'bg-green-100 text-green-700' },
  IDLE:        { label: 'Idle',        color: 'bg-gray-100  text-gray-600'  },
  MAINTENANCE: { label: 'Maintenance', color: 'bg-amber-100 text-amber-700' },
  OFFLINE:     { label: 'Offline',     color: 'bg-red-100   text-red-600'   },
}

export default function PumpStatusButton({ pumpId, currentStatus }: Props) {
  const [open, setOpen]           = useState(false)
  const [isPending, startTransition] = useTransition()

  // useTransition — keeps UI responsive while Server Action runs
  function handleStatusChange(newStatus: PumpStatus) {
    setOpen(false)
    startTransition(async () => {
      await updatePumpStatus(pumpId, newStatus)
    })
  }

  const current = statusConfig[currentStatus]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isPending}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
          transition-opacity ${isPending ? 'opacity-50' : ''}
          ${current.color}`}
      >
        {isPending ? 'Updating…' : current.label}
        <ChevronDown size={12} />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop to close */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-8 left-0 z-20 bg-white rounded-lg shadow-lg
            border border-gray-200 py-1 min-w-32.5">
            {(Object.keys(statusConfig) as PumpStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50
                  flex items-center gap-2
                  ${status === currentStatus ? 'font-medium' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  status === 'ACTIVE'      ? 'bg-green-500' :
                  status === 'IDLE'        ? 'bg-gray-400'  :
                  status === 'MAINTENANCE' ? 'bg-amber-500' :
                                             'bg-red-500'
                }`} />
                {statusConfig[status].label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}