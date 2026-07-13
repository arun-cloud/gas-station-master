'use client'

import { useState, useTransition } from 'react'
import { Plus, X } from 'lucide-react'
import { addNozzle } from '@/app/actions/nozzle.actions'

type FuelType = 'PETROL_91' | 'PETROL_95' | 'DIESEL' | 'PREMIUM_DIESEL'

type AddNozzleFormProps = {
  dispenserId: string
  nextNozzleNumber: number
}

const fuelTypeOptions: Array<{ value: FuelType; label: string }> = [
  { value: 'PETROL_91', label: 'Petrol 91' },
  { value: 'PETROL_95', label: 'Petrol 95' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'PREMIUM_DIESEL', label: 'Premium Diesel' },
]

export default function AddNozzleForm({ dispenserId, nextNozzleNumber }: AddNozzleFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [nozzleNumber, setNozzleNumber] = useState(String(nextNozzleNumber))
  const [fuelType, setFuelType] = useState<FuelType>('PETROL_91')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    const formData = new FormData()
    formData.set('nozzleNumber', nozzleNumber)
    formData.set('fuelType', fuelType)

    startTransition(async () => {
      const result = await addNozzle(dispenserId, formData)
      if (!result.success) {
        setError(result.error ?? 'Failed to add nozzle')
        return
      }
      setIsOpen(false)
      setNozzleNumber(String(nextNozzleNumber + 1))
    })
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 hover:border-amber-400 hover:text-amber-600"
      >
        <Plus size={14} />
        Add nozzle
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={nozzleNumber}
          onChange={event => setNozzleNumber(event.target.value)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          placeholder="No."
        />
        <select
          value={fuelType}
          onChange={event => setFuelType(event.target.value as FuelType)}
          className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {fuelTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-amber-400 disabled:opacity-60"
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={14} />
        </button>
      </div>
      {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}
