'use client'

import { useState, useTransition } from 'react'
import { Ban, CheckCircle2 } from 'lucide-react'

type ActionResult = { success: boolean; error?: string }

type ActiveToggleProps = {
  id: string
  isActive: boolean
  action: (id: string, nextValue: boolean) => Promise<ActionResult>
  confirmDisableMessage: string
  size?: number
}

export default function ActiveToggle({
  id,
  isActive,
  action,
  confirmDisableMessage,
  size = 16,
}: ActiveToggleProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleToggle() {
    setError(null)
    const nextValue = !isActive

    const confirmed = nextValue ? true : window.confirm(confirmDisableMessage)
    if (!confirmed) return

    startTransition(async () => {
      const result = await action(id, nextValue)
      if (!result.success) {
        setError(result.error ?? 'Failed to update status')
      }
    })
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        title={isActive ? 'Decommission' : 'Restore'}
        className={`rounded-lg p-2 hover:bg-gray-100 disabled:opacity-60 ${
          isActive ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-green-600'
        }`}
      >
        {isActive ? <Ban size={size} /> : <CheckCircle2 size={size} />}
      </button>
      {error ? <span className="mt-0.5 text-xs text-red-500">{error}</span> : null}
    </div>
  )
}
