import { Truck } from 'lucide-react'
import SupplierForm, { type SupplierFormValues } from './SupplierForm'
import SupplierStatusToggle from './SupplierStatusToggle'
import type { SupplierListItem } from '@/lib/services/supplier-service'

type BranchOption = {
  id: string
  nameEn: string
  branchCode: string
}

export default function SuppliersTable({
  suppliers,
  branches,
  canManage,
}: {
  suppliers: SupplierListItem[]
  branches: BranchOption[]
  canManage: boolean
}) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-400">
        <Truck size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No suppliers match the selected filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table className="w-full min-w-[1050px] text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">VAT / Contact</th>
            <th className="px-4 py-3 font-medium">Terms</th>
            <th className="px-4 py-3 font-medium">Branches</th>
            <th className="px-4 py-3 font-medium">Activity</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {suppliers.map(supplier => {
            const formValue: SupplierFormValues = {
              id: supplier.id,
              supplierCode: supplier.supplierCode,
              nameEn: supplier.nameEn,
              nameAr: supplier.nameAr,
              legalName: supplier.legalName,
              type: supplier.type as SupplierFormValues['type'],
              vatNumber: supplier.vatNumber,
              crNumber: supplier.crNumber,
              contactName: supplier.contactName,
              phone: supplier.phone,
              email: supplier.email,
              address: supplier.address,
              city: supplier.city,
              paymentTermsDays: supplier.paymentTermsDays,
              creditLimit: supplier.creditLimit,
              notes: supplier.notes,
              branchIds: supplier.branches.map(branch => branch.id),
            }

            return (
              <tr key={supplier.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{supplier.nameEn}</p>
                  <p className="text-xs text-gray-400">
                    {supplier.supplierCode}
                    {supplier.nameAr ? ` · ${supplier.nameAr}` : ''}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600">{supplier.type.replaceAll('_', ' ')}</td>
                <td className="px-4 py-3 text-gray-600">
                  <p>{supplier.vatNumber ?? 'No VAT number'}</p>
                  <p className="text-xs text-gray-400">
                    {[supplier.contactName, supplier.phone].filter(Boolean).join(' · ') || 'No contact'}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <p>{supplier.paymentTermsDays} days</p>
                  <p className="text-xs text-gray-400">
                    Limit SAR {Number(supplier.creditLimit).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {supplier.branches.map(branch => branch.branchCode).join(', ')}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <p>{supplier.purchaseOrderCount} POs</p>
                  <p className="text-xs text-gray-400">{supplier.deliveryCount} deliveries</p>
                </td>
                <td className="px-4 py-3">
                  {canManage ? (
                    <SupplierStatusToggle supplierId={supplier.id} isActive={supplier.isActive} />
                  ) : (
                    <span className={supplier.isActive ? 'text-green-700' : 'text-gray-500'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                {canManage ? (
                  <td className="px-4 py-3 text-right">
                    <SupplierForm mode="edit" branches={branches} supplier={formValue} />
                  </td>
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
