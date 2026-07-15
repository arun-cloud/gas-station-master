'use client'

import { useState, useTransition } from 'react'
import { recordDelivery } from '@/app/actions/fuel.actions'
import { Plus, X, Truck } from 'lucide-react'

interface Tank {
  id: string
  tankNumber: number
  fuelType: string
}

interface Supplier {
  id: string
  name: string
}

interface PurchaseOrder {
  id: string
  orderNumber: string
}

interface Props {
  tanks: Tank[]
  suppliers: Supplier[]
  purchaseOrders: PurchaseOrder[]
}

const fuelLabels: Record<string, string> = {
  PETROL_91: 'Petrol 91',
  PETROL_95: 'Petrol 95',
  DIESEL: 'Diesel',
  PREMIUM_DIESEL: 'Premium Diesel',
}

export default function AddDeliveryForm({ tanks, suppliers, purchaseOrders }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  // Live total cost preview
  const [litres, setLitres] = useState('')
  const [price, setPrice] = useState('')
  const totalCost = litres && price
    ? (parseFloat(litres) * parseFloat(price)).toFixed(2)
    : null

  async function handleSubmit(formData: FormData) {
    setError('')
    startTransition(async () => {
      const result = await recordDelivery(formData)
      if (result.success) {
        setOpen(false)
        setLitres('')
        setPrice('')
      } else {
        setError(result.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600
          text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Truck size={16} />
        Record Delivery
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center
          justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50
            max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800">
                Record Fuel Delivery
              </h2>
              <button onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-4">

              {/* Tank selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tank
                </label>
                <select name="tankId" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="">Select tank</option>
                  {tanks.map(t => (
                    <option key={t.id} value={t.id}>
                      Tank #{t.tankNumber} — {fuelLabels[t.fuelType] ?? t.fuelType}
                    </option>
                  ))}
                </select>
              </div>

              {/* Supplier selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select name="supplierId" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Purchase order selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Order
                </label>
                <select name="purchaseOrderId" required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
                  <option value="">Select purchase order</option>
                  {purchaseOrders.map(po => (
                    <option key={po.id} value={po.id}>{po.orderNumber}</option>
                  ))}
                </select>
              </div>

              {/* Litres + price side by side */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Litres Delivered
                  </label>
                  <input
                    name="litres" type="number" min="1" step="0.01" required
                    placeholder="e.g. 5000"
                    value={litres}
                    onChange={e => setLitres(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                      text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price / Litre (SAR)
                  </label>
                  <input
                    name="pricePerLitre" type="number" min="0.01" step="0.01" required
                    placeholder="e.g. 1.35"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg
                      text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Live total cost preview */}
              {totalCost && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg
                  px-4 py-3 flex justify-between items-center">
                  <span className="text-sm text-amber-700">Total Cost</span>
                  <span className="text-base font-bold text-amber-800">
                    SAR {totalCost}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  name="notes" rows={2} placeholder="Delivery notes…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500
                    resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300
                    rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isPending}
                  className="flex-1 px-4 py-2 text-sm bg-amber-500 hover:bg-amber-600
                    text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isPending ? 'Saving…' : 'Record Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}