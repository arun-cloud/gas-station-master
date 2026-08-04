'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  createReferenceCategory,
  updateReferenceCategory,
} from '@/app/actions/reference-data.actions'
import type { ReferenceDataCategoryDto } from '@/lib/reference-data/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500'

type Props = {
  mode: 'create' | 'edit'
  category?: ReferenceDataCategoryDto
}

export default function ReferenceCategoryForm({ mode, category }: Props) {
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
          ? await createReferenceCategory(formData)
          : await updateReferenceCategory(category?.id ?? '', formData)

      if (!result.success) {
        setError(result.error ?? 'Failed to save the category')
        return
      }

      close()

      if (mode === 'create' && result.entityId) {
        router.push(`/settings/master-data/reference-data?category=${result.entityId}`)
        return
      }

      router.refresh()
    })
  }

  return (
    <>
      {mode === 'create' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-amber-400"
        >
          <Plus size={16} />
          Add Category
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Edit category"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reference-category-title"
            className="mx-auto my-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="reference-category-title" className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Add Reference Category' : 'Edit Reference Category'}
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
                  Category Code
                  <input
                    name="code"
                    required
                    maxLength={50}
                    defaultValue={category?.code ?? ''}
                    placeholder="EXPENSE_CATEGORY"
                    className={`${inputClass} uppercase`}
                  />
                </label>

                <label className="text-xs font-medium text-gray-500">
                  Name (English)
                  <input
                    name="nameEn"
                    required
                    maxLength={120}
                    defaultValue={category?.nameEn ?? ''}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-xs font-medium text-gray-500">
                Name (Arabic)
                <input
                  name="nameAr"
                  dir="rtl"
                  maxLength={120}
                  defaultValue={category?.nameAr ?? ''}
                  className={inputClass}
                />
              </label>

              <label className="block text-xs font-medium text-gray-500">
                Description
                <textarea
                  name="description"
                  rows={3}
                  maxLength={500}
                  defaultValue={category?.description ?? ''}
                  className={inputClass}
                />
              </label>

              <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                Use reference data only for reusable lookup values. Products, services, accounts,
                taxes, and operational transactions belong in their dedicated modules.
              </p>

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
                      ? 'Create Category'
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
