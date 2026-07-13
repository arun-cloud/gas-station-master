'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createDispenser } from '@/app/actions/dispenser.actions'

type FuelType = 'PETROL_91' | 'PETROL_95' | 'DIESEL' | 'PREMIUM_DIESEL'

type NozzleRow = {
  rowId: number
  nozzleNumber: string
  fuelType: FuelType
}

type DispenserFormProps = {
  branchId: string
}

const fuelTypeOptions: Array<{ value: FuelType; label: string }> = [
  { value: 'PETROL_91', label: 'Petrol 91' },
  { value: 'PETROL_95', label: 'Petrol 95' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'PREMIUM_DIESEL', label: 'Premium Diesel' },
]

function getInitialNozzles(): NozzleRow[] {
  return [{ rowId: 1, nozzleNumber: '1', fuelType: 'PETROL_91' }]
}

export default function DispenserForm({ branchId }: DispenserFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dispenserNumber, setDispenserNumber] = useState('')
  const [nozzles, setNozzles] = useState<NozzleRow[]>(getInitialNozzles())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetForm() {
    setDispenserNumber('')
    setNozzles(getInitialNozzles())
    setError(null)
  }

  function addNozzleRow() {
    setNozzles(rows => [
      ...rows,
      {
        rowId: (rows.at(-1)?.rowId ?? 0) + 1,
        nozzleNumber: String(rows.length + 1),
        fuelType: 'PETROL_91',
      },
    ])
  }

  function removeNozzleRow(rowId: number) {
    setNozzles(rows => (rows.length > 1 ? rows.filter(row => row.rowId !== rowId) : rows))
  }

  function updateNozzleRow(rowId: number, patch: Partial<Omit<NozzleRow, 'rowId'>>) {
    setNozzles(rows => rows.map(row => (row.rowId === rowId ? { ...row, ...patch } : row)))
  }

  function handleSubmit() {
    setError(null)

    const formData = new FormData()
    formData.set('branchId', branchId)
    formData.set('dispenserNumber', dispenserNumber)
    formData.set('nozzleCount', String(nozzles.length))
    nozzles.forEach((nozzle, index) => {
      formData.set(`nozzleNumber_${index}`, nozzle.nozzleNumber)
      formData.set(`fuelType_${index}`, nozzle.fuelType)
    })

    startTransition(async () => {
      const result = await createDispenser(formData)
      if (!result.success) {
        setError(result.error ?? 'Failed to create dispenser')
        return
      }
      resetForm()
      setIsOpen(false)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
      >
        <Plus size={16} />
        Add Dispenser
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Add Dispenser</h2>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setIsOpen(false)
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Dispenser number
                </label>
                <input
                  type="number"
                  min={1}
                  value={dispenserNumber}
                  onChange={event => setDispenserNumber(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="e.g. 1"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Nozzles</label>
                  <button
                    type="button"
                    onClick={addNozzleRow}
                    className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    <Plus size={14} />
                    Add nozzle
                  </button>
                </div>

                <div className="space-y-2">
                  {nozzles.map(nozzle => (
                    <div key={nozzle.rowId} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={nozzle.nozzleNumber}
                        onChange={event =>
                          updateNozzleRow(nozzle.rowId, { nozzleNumber: event.target.value })
                        }
                        className="w-20 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="No."
                      />
                      <select
                        value={nozzle.fuelType}
                        onChange={event =>
                          updateNozzleRow(nozzle.rowId, {
                            fuelType: event.target.value as FuelType,
                          })
                        }
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {fuelTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeNozzleRow(nozzle.rowId)}
                        disabled={nozzles.length === 1}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm()
                    setIsOpen(false)
                  }}
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
                  {isPending ? 'Creating…' : 'Create Dispenser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
