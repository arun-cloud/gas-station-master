'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useEffect } from 'react'

export default function ReferenceDataError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Reference Data page failed:', error)
  }, [error])

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle size={34} className="mx-auto text-red-500" />
      <h2 className="mt-3 text-lg font-semibold text-red-900">Reference data could not be loaded</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-red-700">
        The request failed before the category and value list could be displayed. No data was changed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
      >
        <RotateCcw size={16} />
        Try Again
      </button>
    </div>
  )
}
