'use client'

import { useState, useTransition } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { triggerManualSync } from '@/app/actions/invoice.actions'

type Feedback = { type: 'success' | 'error'; message: string } | null

export default function SyncNowButton() {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<Feedback>(null)

  function handleClick() {
    setFeedback(null)
    startTransition(async () => {
      const result = await triggerManualSync()

      if (!result.success) {
        setFeedback({ type: 'error', message: result.error })
        return
      }

      const { created, updated, fetched } = result.summary
      setFeedback({
        type: 'success',
        message:
          fetched === 0
            ? 'Already up to date — no new receipts found'
            : `Synced ${fetched} receipt${fetched === 1 ? '' : 's'} (${created} new, ${updated} updated)`,
      })
    })
  }

  return (
    <div className="flex items-center gap-3">
      {feedback ? (
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${
            feedback.type === 'success' ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
          {feedback.message}
        </span>
      ) : null}

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw size={16} className={isPending ? 'animate-spin' : ''} />
        {isPending ? 'Syncing…' : 'Sync Now'}
      </button>
    </div>
  )
}
