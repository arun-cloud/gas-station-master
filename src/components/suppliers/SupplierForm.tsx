'use client'

import { useState, useTransition } from 'react'
import { Pencil, Plus, X } from 'lucide-react'
import { createSupplier, updateSupplier } from '@/app/actions/supplier.actions'

type BranchOption = {
  id: string
  nameEn: string
  branchCode: string
}

export type SupplierFormValues = {
  id: string
  supplierCode: string
  nameEn: string
  nameAr: string | null
  legalName: string | null
  type: 'FUEL' | 'PRODUCT' | 'SERVICE' | 'UTILITY' | 'GOVERNMENT' | 'OTHER'
  vatNumber: string | null
  crNumber: string | null
  contactName: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  paymentTermsDays: number
  creditLimit: string
  notes: string | null
  branchIds: string[]
}

type Props = {
  mode: 'create' | 'edit'
  branches: BranchOption[]
  supplier?: SupplierFormValues
}

const supplierTypes = [
  ['FUEL', 'Fuel supplier'],
  ['PRODUCT', 'Product supplier'],
  ['SERVICE', 'Service provider'],
  ['UTILITY', 'Utility provider'],
  ['GOVERNMENT', 'Government entity'],
  ['OTHER', 'Other'],
] as const

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500'

export default function SupplierForm({ mode, branches, supplier }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const initial: SupplierFormValues = supplier ?? {
    id: '',
    supplierCode: '',
    nameEn: '',
    nameAr: null,
    legalName: null,
    type: 'OTHER',
    vatNumber: null,
    crNumber: null,
    contactName: null,
    phone: null,
    email: null,
    address: null,
    city: null,
    paymentTermsDays: 0,
    creditLimit: '0.00',
    notes: null,
    branchIds: branches.length === 1 ? [branches[0].id] : [],
  }

  function handleSubmit(formData: FormData) {
    setError(null)

    startTransition(async () => {
      const result =
        mode === 'create'
          ? await createSupplier(formData)
          : await updateSupplier(initial.id, formData)

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
          Add Supplier
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title="Edit supplier"
        >
          <Pencil size={16} />
        </button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
          <div className="mx-auto my-6 w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs font-medium text-gray-500">
                  Supplier Code
                  <input
                    name="supplierCode"
                    required
                    defaultValue={initial.supplierCode}
                    className={`${inputClass} uppercase`}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500 md:col-span-2">
                  Name (English)
                  <input name="nameEn" required defaultValue={initial.nameEn} className={inputClass} />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-gray-500">
                  Name (Arabic)
                  <input
                    name="nameAr"
                    dir="rtl"
                    defaultValue={initial.nameAr ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  Legal Name
                  <input
                    name="legalName"
                    defaultValue={initial.legalName ?? ''}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs font-medium text-gray-500">
                  Supplier Type
                  <select name="type" defaultValue={initial.type} className={inputClass}>
                    {supplierTypes.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-gray-500">
                  VAT Number
                  <input
                    name="vatNumber"
                    inputMode="numeric"
                    maxLength={15}
                    defaultValue={initial.vatNumber ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  CR Number
                  <input
                    name="crNumber"
                    inputMode="numeric"
                    maxLength={10}
                    defaultValue={initial.crNumber ?? ''}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs font-medium text-gray-500">
                  Contact Name
                  <input
                    name="contactName"
                    defaultValue={initial.contactName ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  Phone
                  <input name="phone" defaultValue={initial.phone ?? ''} className={inputClass} />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  Email
                  <input
                    name="email"
                    type="email"
                    defaultValue={initial.email ?? ''}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-gray-500">
                  Address
                  <input
                    name="address"
                    defaultValue={initial.address ?? ''}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  City
                  <input name="city" defaultValue={initial.city ?? ''} className={inputClass} />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-medium text-gray-500">
                  Payment Terms (days)
                  <input
                    name="paymentTermsDays"
                    type="number"
                    min={0}
                    max={365}
                    defaultValue={initial.paymentTermsDays}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs font-medium text-gray-500">
                  Credit Limit (SAR)
                  <input
                    name="creditLimit"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={initial.creditLimit}
                    className={inputClass}
                  />
                </label>
              </div>

              <fieldset>
                <legend className="text-xs font-medium text-gray-500">Available Branches</legend>
                <div className="mt-2 grid gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-2">
                  {branches.map(branch => (
                    <label key={branch.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="branchIds"
                        value={branch.id}
                        defaultChecked={initial.branchIds.includes(branch.id)}
                        className="h-4 w-4 rounded border-gray-300 text-amber-500"
                      />
                      {branch.nameEn} ({branch.branchCode})
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="block text-xs font-medium text-gray-500">
                Notes
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={initial.notes ?? ''}
                  className={inputClass}
                />
              </label>

              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
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
                  {isPending ? 'Saving...' : mode === 'create' ? 'Create Supplier' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
