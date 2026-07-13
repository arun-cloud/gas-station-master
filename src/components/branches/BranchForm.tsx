'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import { createBranch, updateBranch } from '@/app/actions/branch.actions'

export type BranchFormValues = {
  id: string
  nameEn: string
  nameAr: string
  branchCode: string
  buildingNo: string
  street: string
  district: string
  city: string
  postalCode: string
}

type BranchFormProps = {
  mode: 'create' | 'edit'
  branch?: BranchFormValues
}

const emptyValues: Omit<BranchFormValues, 'id'> = {
  nameEn: '',
  nameAr: '',
  branchCode: '',
  buildingNo: '',
  street: '',
  district: '',
  city: '',
  postalCode: '',
}

export default function BranchForm({ mode, branch }: BranchFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const initial = branch ?? { id: '', ...emptyValues }

  function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createBranch(formData)
          : await updateBranch(initial.id, formData)

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
          Add Branch
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Edit branch"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Add Branch' : 'Edit Branch'}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Name (English)
                  </label>
                  <input
                    name="nameEn"
                    required
                    defaultValue={initial.nameEn}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Name (Arabic)
                  </label>
                  <input
                    name="nameAr"
                    required
                    dir="rtl"
                    defaultValue={initial.nameAr}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Branch Code
                </label>
                <input
                  name="branchCode"
                  required
                  placeholder="e.g. JED-02"
                  defaultValue={initial.branchCode}
                  disabled={mode === 'edit'}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                />
                {mode === 'edit' ? (
                  <p className="mt-1 text-xs text-gray-400">
                    Branch code cannot be changed after creation.
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Building No.
                  </label>
                  <input
                    name="buildingNo"
                    required
                    defaultValue={initial.buildingNo}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Street
                  </label>
                  <input
                    name="street"
                    required
                    defaultValue={initial.street}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    District
                  </label>
                  <input
                    name="district"
                    required
                    defaultValue={initial.district}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    City
                  </label>
                  <input
                    name="city"
                    required
                    defaultValue={initial.city}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">
                    Postal Code
                  </label>
                  <input
                    name="postalCode"
                    required
                    defaultValue={initial.postalCode}
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400 disabled:opacity-60"
                >
                  {isPending
                    ? 'Saving...'
                    : mode === 'create'
                      ? 'Create Branch'
                      : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
