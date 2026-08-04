import Link from 'next/link'
import { Database, ListTree, LockKeyhole } from 'lucide-react'
import ReferenceCategoryForm from './ReferenceCategoryForm'
import ReferenceStatusToggle from './ReferenceStatusToggle'
import ReferenceValueForm from './ReferenceValueForm'
import type {
  ReferenceDataCategoryDetailDto,
  ReferenceDataCategoryDto,
} from '@/lib/reference-data/types'

type Props = {
  categories: ReferenceDataCategoryDto[]
  selectedCategory: ReferenceDataCategoryDetailDto | null
  canManage: boolean
}

export default function ReferenceDataManager({
  categories,
  selectedCategory,
  canManage,
}: Props) {
  if (categories.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
        <Database size={42} className="mx-auto text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-800">No reference categories yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
          Create a category, then add the reusable lookup values used by forms and business rules.
        </p>
        {canManage ? (
          <div className="mt-5 flex justify-center">
            <ReferenceCategoryForm mode="create" />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-700">
            Administrator or manager permission is required to create reference data.
          </p>
        )}
      </section>
    )
  }

  const nextDisplayOrder = selectedCategory
    ? Math.max(0, ...selectedCategory.values.map(value => value.displayOrder)) + 10
    : 0

  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="font-semibold text-gray-800">Categories</h2>
            <p className="text-xs text-gray-400">{categories.length} configured</p>
          </div>
          {canManage ? <ReferenceCategoryForm mode="create" /> : null}
        </div>

        <nav className="max-h-[650px] overflow-y-auto p-2">
          {categories.map(category => {
            const selected = category.id === selectedCategory?.id

            return (
              <Link
                key={category.id}
                href={`/settings/master-data/reference-data?category=${category.id}`}
                className={`mb-1 block rounded-lg px-3 py-3 transition-colors ${
                  selected
                    ? 'bg-amber-50 text-amber-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{category.nameEn}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">{category.code}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    {category.valueCount}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <span className={category.isActive ? 'text-green-700' : 'text-gray-400'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {category.isSystem ? (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <LockKeyhole size={11} /> System
                    </span>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </nav>
      </aside>

      {selectedCategory ? (
        <section className="min-w-0 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
                  <ListTree size={22} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">{selectedCategory.nameEn}</h2>
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                      {selectedCategory.code}
                    </span>
                  </div>
                  {selectedCategory.nameAr ? (
                    <p dir="rtl" className="mt-1 w-fit text-sm text-gray-500">
                      {selectedCategory.nameAr}
                    </p>
                  ) : null}
                  <p className="mt-2 max-w-2xl text-sm text-gray-500">
                    {selectedCategory.description ?? 'No category description has been added.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {canManage && !selectedCategory.isSystem ? (
                  <ReferenceCategoryForm mode="edit" category={selectedCategory} />
                ) : null}
                {canManage ? (
                  <ReferenceStatusToggle
                    recordType="category"
                    recordId={selectedCategory.id}
                    isActive={selectedCategory.isActive}
                    isSystem={selectedCategory.isSystem}
                  />
                ) : (
                  <span
                    className={
                      selectedCategory.isActive
                        ? 'rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700'
                        : 'rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500'
                    }
                  >
                    {selectedCategory.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="font-semibold text-gray-800">Values</h3>
                <p className="text-xs text-gray-400">
                  {selectedCategory.values.length} value
                  {selectedCategory.values.length === 1 ? '' : 's'}
                </p>
              </div>
              {canManage && selectedCategory.isActive ? (
                <ReferenceValueForm
                  mode="create"
                  categoryId={selectedCategory.id}
                  defaultDisplayOrder={nextDisplayOrder}
                />
              ) : null}
            </div>

            {selectedCategory.values.length === 0 ? (
              <div className="px-6 py-14 text-center text-gray-400">
                <ListTree size={36} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No values have been added to this category.</p>
                {!selectedCategory.isActive ? (
                  <p className="mt-2 text-xs text-amber-700">
                    Activate the category before adding values.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Code</th>
                      <th className="px-4 py-3 font-medium">English Value</th>
                      <th className="px-4 py-3 font-medium">Arabic Value</th>
                      <th className="px-4 py-3 text-center font-medium">Order</th>
                      <th className="px-4 py-3 text-center font-medium">Default</th>
                      <th className="px-4 py-3 text-right font-medium">Status</th>
                      {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedCategory.values.map(value => (
                      <tr key={value.id} className={value.isActive ? '' : 'bg-gray-50/60'}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{value.code}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{value.nameEn}</p>
                          {value.description ? (
                            <p className="mt-0.5 max-w-sm truncate text-xs text-gray-400">
                              {value.description}
                            </p>
                          ) : null}
                        </td>
                        <td dir="rtl" className="px-4 py-3 text-gray-600">
                          {value.nameAr ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">{value.displayOrder}</td>
                        <td className="px-4 py-3 text-center">
                          {value.isDefault ? (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              Default
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {canManage ? (
                              <ReferenceStatusToggle
                                recordType="value"
                                recordId={value.id}
                                isActive={value.isActive}
                                isSystem={value.isSystem}
                              />
                            ) : (
                              <span className={value.isActive ? 'text-green-700' : 'text-gray-500'}>
                                {value.isActive ? 'Active' : 'Inactive'}
                              </span>
                            )}
                          </div>
                        </td>
                        {canManage ? (
                          <td className="px-4 py-3 text-right">
                            {!value.isSystem ? (
                              <ReferenceValueForm
                                mode="edit"
                                categoryId={selectedCategory.id}
                                value={value}
                              />
                            ) : (
                              <span className="text-xs text-blue-600">Protected</span>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-400 shadow-sm">
          Select a reference category to view its values.
        </section>
      )}
    </div>
  )
}
