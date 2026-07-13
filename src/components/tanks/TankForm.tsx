'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { createTank, updateTank } from '@/app/actions/tank.actions'

type FuelType = 'PETROL_91' | 'PETROL_95' | 'DIESEL' | 'PREMIUM_DIESEL'

export type TankFormValues = {
  id: string
  tankNumber: string
  fuelType: FuelType
  capacity: string
  currentLevel: string
  minLevel: string
}

type TankFormProps = {
  mode: 'create' | 'edit'
  branchId: string
  tank?: TankFormValues
}

const fuelTypeOptions: Array<{ value: FuelType; label: string }> = [
  { value: 'PETROL_91', label: 'Petrol 91' },
  { value: 'PETROL_95', label: 'Petrol 95' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'PREMIUM_DIESEL', label: 'Premium Diesel' },
]

const emptyValues: Omit<TankFormValues, 'id'> = {
  tankNumber: '',
  fuelType: 'PETROL_91',
  capacity: '',
  currentLevel: '',
  minLevel: '',
}

export default function TankForm({ mode, branchId, tank }: TankFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [values, setValues] = useState<TankFormValues>(tank ?? { id: '', ...emptyValues })
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function patch(update: Partial<TankFormValues>) {
    setValues(current => ({ ...current, ...update }))
  }

  function handleSubmit() {
    setError(null)

    const formData = new FormData()
    formData.set('branchId', branchId)
    formData.set('tankNumber', values.tankNumber)
    formData.set('fuelType', values.fuelType)
    formData.set('capacity', values.capacity)
    formData.set('currentLevel', values.currentLevel)
    formData.set('minLevel', values.minLevel)

    startTransition(async () => {
      const result =
        mode === 'create' ? await createTank(formData) : await updateTank(values.id, formData)

      if (!result.success) {
        setError(result.error ?? 'Something went wrong')
        return
      }

      setIsOpen(false)
    })
  }

  return (
    <>
      {mode === 'create' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
        >
          <Plus size={16} />
          Add Tank
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Edit tank"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Add Tank' : 'Edit Tank'}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tank number
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={values.tankNumber}
                    onChange={event => patch({ tankNumber: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Fuel type
                  </label>
                  <select
                    value={values.fuelType}
                    onChange={event => patch({ fuelType: event.target.value as FuelType })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {fuelTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Capacity (litres)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={values.capacity}
                  onChange={event => patch({ capacity: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Current level (litres)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={values.currentLevel}
                    onChange={event => patch({ currentLevel: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Manual override. Deliveries will adjust this automatically in a later phase.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Min. alert level (litres)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.001"
                    value={values.minLevel}
                    onChange={event => patch({ minLevel: event.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400 disabled:opacity-60"
                >
                  {isPending ? 'Saving…' : mode === 'create' ? 'Create Tank' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
