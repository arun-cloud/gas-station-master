'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  createReferenceValue,
  updateReferenceValue,
} from '@/app/actions/reference-data.actions'
import type { ReferenceDataValueDto } from '@/lib/reference-data/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500'

type Props = {
  mode: 'create' | 'edit'
  categoryId: string
  value?: ReferenceDataValueDto
  defaultDisplayOrder?: number
}

export default function ReferenceValueForm({
  mode,
  categoryId,
  value,
  defaultDisplayOrder = 0,
}: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    setError(null)
    setIsOpen(false)
  }

  function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createReferenceValue(categoryId, formData)
          : await updateReferenceValue(value?.id ?? '', formData)

      if (!result.success) {
        setError(result.error ?? 'Failed to save the reference value')
        return
      }

      close()
      router.refresh()
    })
  }

  return (
    <>
      {mode === 'create' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          <Plus size={16} />
          Add Value
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Edit value"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-value-title"
            className="mx-auto my-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="reference-value-title" className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Add Reference Value' : 'Edit Reference Value'}
              </h2>
              <button
                type="button"
                onClick={close}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-gray-500">
                  Value Code
                  <input
                    name="code"
                    required
                    maxLength={50}
                    defaultValue={value?.code ?? ''}
                    placeholder="CASH"
                    className={`${inputClass} uppercase`}
                  />
                </label>

                <label className="text-xs font-medium text-gray-500">
                  Display Order
                  <input
                    name="displayOrder"
                    type="number"
                    min={0}
                    max={9999}
                    required
                    defaultValue={value?.displayOrder ?? defaultDisplayOrder}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-gray-500">
                Value (English)
                <input
                  name="nameEn"
                  required
                  maxLength={150}
                  defaultValue={value?.nameEn ?? ''}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-medium text-gray-500">
                Value (Arabic)
                <input
                  name="nameAr"
                  dir="rtl"
                  maxLength={150}
                  defaultValue={value?.nameAr ?? ''}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-medium text-gray-500">
                Description
                <textarea
                  name="description"
                  rows={3}
                  maxLength={500}
                  defaultValue={value?.description ?? ''}
                  className={inputClass}
                />
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isDefault"
                  defaultChecked={value?.isDefault ?? false}
                  className="h-4 w-4 rounded border-gray-300 text-amber-500"
                />
                Use as the default value for this category
              </label>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
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
                      ? 'Create Value'
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
