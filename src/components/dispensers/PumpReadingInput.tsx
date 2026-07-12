'use client'

import { useState, useTransition } from 'react'
import { updateNozzleReading } from '@/app/actions/pump.actions'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  nozzleId: string
  reading: number
}

export default function PumpReadingInput({ nozzleId, reading }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(reading.toString())
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const num = parseFloat(value)
    if (isNaN(num) || num < 0) return

    startTransition(async () => {
      await updateNozzleReading(nozzleId, num)
      setEditing(false)
    })
  }

  function handleCancel() {
    setValue(reading.toString())
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-700">
          {Number(reading).toLocaleString()} L
        </span>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-24 px-2 py-1 text-sm border border-amber-400 rounded-md
          focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') handleCancel()
        }}
      />
      <button
        onClick={handleSave}
        disabled={isPending}
        className="text-green-600 hover:text-green-700 transition-colors"
      >
        <Check size={15} />
      </button>
      <button
        onClick={handleCancel}
        className="text-red-400 hover:text-red-600 transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  )
}