'use client'

import {
  useRef,
  useState,
  useTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { addPump } from '@/app/actions/pump.actions'

type FuelType =
  | 'PETROL_91'
  | 'PETROL_95'
  | 'DIESEL'
  | 'PREMIUM_DIESEL'

type NozzleRow = {
  rowId: number
  nozzleNumber: string
  fuelType: FuelType
  currentReading: string
}

type AddPumpFormProps = {
  branchId: string
}

const fuelTypeOptions: Array<{
  value: FuelType
  label: string
}> = [
    {
      value: 'PETROL_91',
      label: 'Petrol 91',
    },
    {
      value: 'PETROL_95',
      label: 'Petrol 95',
    },
    {
      value: 'DIESEL',
      label: 'Diesel',
    },
    {
      value: 'PREMIUM_DIESEL',
      label: 'Premium Diesel',
    },
  ]

function getInitialNozzles(): NozzleRow[] {
  return [
    {
      rowId: 1,
      nozzleNumber: '1',
      fuelType: 'PETROL_91',
      currentReading: '0.000',
    },
    {
      rowId: 2,
      nozzleNumber: '2',
      fuelType: 'PETROL_95',
      currentReading: '0.000',
    },
  ]
}

export default function AddPumpForm({
  branchId,
}: AddPumpFormProps) {
  const router = useRouter()
  const nextRowId = useRef(3)

  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] =
    useTransition()

  const [dispenserNumber, setDispenserNumber] =
    useState('')

  const [nozzles, setNozzles] =
    useState<NozzleRow[]>(getInitialNozzles())

  function resetForm(): void {
    setDispenserNumber('')
    setNozzles(getInitialNozzles())
    nextRowId.current = 3
    setError('')
  }

  function closeModal(): void {
    if (isPending) {
      return
    }

    setOpen(false)
    resetForm()
  }

  function addNozzle(): void {
    if (nozzles.length >= 12) {
      setError(
        'A dispenser can contain a maximum of 12 nozzles',
      )
      return
    }

    const existingNozzleNumbers = nozzles
      .map(nozzle => Number(nozzle.nozzleNumber))
      .filter(Number.isFinite)

    const nextNozzleNumber =
      existingNozzleNumbers.length > 0
        ? Math.max(...existingNozzleNumbers) + 1
        : 1

    setNozzles(current => [
      ...current,
      {
        rowId: nextRowId.current++,
        nozzleNumber: String(nextNozzleNumber),
        fuelType: 'PETROL_91',
        currentReading: '0.000',
      },
    ])

    setError('')
  }

  function removeNozzle(rowId: number): void {
    if (nozzles.length === 1) {
      setError(
        'A dispenser must contain at least one nozzle',
      )
      return
    }

    setNozzles(current =>
      current.filter(
        nozzle => nozzle.rowId !== rowId,
      ),
    )

    setError('')
  }

  function updateNozzle(
    rowId: number,
    field:
      | 'nozzleNumber'
      | 'fuelType'
      | 'currentReading',
    value: string,
  ): void {
    setNozzles(current =>
      current.map(nozzle =>
        nozzle.rowId === rowId
          ? {
            ...nozzle,
            [field]: value,
          }
          : nozzle,
      ),
    )
  }

  function handleSubmit(
    formData: FormData,
  ): void {
    setError('')

    startTransition(() => {
      void addPump(formData).then(result => {
        if (!result.success) {
          setError(
            result.error ?? 'Something went wrong',
          )
          return
        }

        setOpen(false)
        resetForm()
        router.refresh()
      })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
      >
        <Plus size={16} />
        Add Dispenser
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dispenser-title"
        >
          <div className="z-50 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-5">
              <div>
                <h2
                  id="add-dispenser-title"
                  className="text-lg font-semibold text-gray-800"
                >
                  Add New Dispenser
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add the dispenser and configure its
                  nozzles.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              action={handleSubmit}
              className="space-y-5 p-6"
            >
              <input
                type="hidden"
                name="branchId"
                value={branchId}
              />

              <input
                type="hidden"
                name="nozzleCount"
                value={nozzles.length}
              />

              <div>
                <label
                  htmlFor="dispenserNumber"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Dispenser Number
                </label>

                <input
                  id="dispenserNumber"
                  name="dispenserNumber"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={dispenserNumber}
                  onChange={event =>
                    setDispenserNumber(
                      event.target.value,
                    )
                  }
                  disabled={isPending}
                  placeholder="e.g. 1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                />
              </div>

              <section className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      Nozzles
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Each nozzle has an independent fuel
                      type and meter reading.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addNozzle}
                    disabled={
                      isPending ||
                      nozzles.length >= 12
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Add Nozzle
                  </button>
                </div>

                <div className="divide-y divide-gray-200">
                  {nozzles.map(
                    (nozzle, index) => (
                      <div
                        key={nozzle.rowId}
                        className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[120px_1fr_180px_40px]"
                      >
                        <div>
                          <label
                            htmlFor={`nozzleNumber-${nozzle.rowId}`}
                            className="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Nozzle No.
                          </label>

                          <input
                            id={`nozzleNumber-${nozzle.rowId}`}
                            name={`nozzleNumber_${index}`}
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={
                              nozzle.nozzleNumber
                            }
                            onChange={event =>
                              updateNozzle(
                                nozzle.rowId,
                                'nozzleNumber',
                                event.target.value,
                              )
                            }
                            disabled={isPending}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`fuelType-${nozzle.rowId}`}
                            className="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Fuel Type
                          </label>

                          <select
                            id={`fuelType-${nozzle.rowId}`}
                            name={`fuelType_${index}`}
                            required
                            value={nozzle.fuelType}
                            onChange={event =>
                              updateNozzle(
                                nozzle.rowId,
                                'fuelType',
                                event.target.value,
                              )
                            }
                            disabled={isPending}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                          >
                            {fuelTypeOptions.map(
                              option => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ),
                            )}
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor={`currentReading-${nozzle.rowId}`}
                            className="mb-1 block text-xs font-medium text-gray-600"
                          >
                            Initial Reading (L)
                          </label>

                          <input
                            id={`currentReading-${nozzle.rowId}`}
                            name={`currentReading_${index}`}
                            type="number"
                            min="0"
                            step="0.001"
                            required
                            value={
                              nozzle.currentReading
                            }
                            onChange={event =>
                              updateNozzle(
                                nozzle.rowId,
                                'currentReading',
                                event.target.value,
                              )
                            }
                            disabled={isPending}
                            placeholder="0.000"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() =>
                              removeNozzle(
                                nozzle.rowId,
                              )
                            }
                            disabled={
                              isPending ||
                              nozzles.length === 1
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label={`Remove nozzle ${nozzle.nozzleNumber}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </section>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <div className="flex gap-3 border-t border-gray-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Add Dispenser
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}