'use client'

import { X, Printer, CheckCircle2 } from 'lucide-react'

interface Receipt {
  id:             string
  fuelType:       string
  litres:         number
  pricePerLitre:  number
  totalAmount:    number
  paymentMethod:  string
  createdAt:      string
}

interface Props {
  receipt:  Receipt
  pumpNumber: number
  onClose:  () => void
}

const fuelLabels: Record<string, string> = {
  PETROL_91:      'Petrol 91',
  PETROL_95:      'Petrol 95',
  DIESEL:         'Diesel',
  PREMIUM_DIESEL: 'Premium Diesel',
}

const paymentLabels: Record<string, string> = {
  CASH:           'Cash',
  CARD:           'Card',
  LOYALTY_POINTS: 'Loyalty Points',
}

export default function SaleReceiptModal({ receipt, pumpNumber, onClose }: Props) {
  const date = new Date(receipt.createdAt)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center
      justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

        {/* Success header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center
            justify-center mx-auto mb-3">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">Sale Recorded</h2>
          <p className="text-sm text-gray-400 mt-0.5">Transaction complete</p>
        </div>

        {/* Receipt body */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm mb-5">

          <div className="flex justify-between">
            <span className="text-gray-400">Receipt #</span>
            <span className="font-mono text-gray-700 text-xs">
              {receipt.id.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Date</span>
            <span className="text-gray-700">
              {date.toLocaleDateString('en-SA', {
                day: '2-digit', month: 'short', year: 'numeric'
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Time</span>
            <span className="text-gray-700">
              {date.toLocaleTimeString('en-SA', {
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Pump</span>
            <span className="text-gray-700">#{pumpNumber}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Fuel type</span>
            <span className="text-gray-700">
              {fuelLabels[receipt.fuelType] ?? receipt.fuelType}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="text-gray-400">Litres</span>
            <span className="font-mono text-gray-700">
              {Number(receipt.litres).toFixed(2)} L
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Price / litre</span>
            <span className="font-mono text-gray-700">
              SAR {Number(receipt.pricePerLitre).toFixed(3)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Payment</span>
            <span className="text-gray-700">
              {paymentLabels[receipt.paymentMethod] ?? receipt.paymentMethod}
            </span>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 pt-3 flex justify-between
            items-baseline">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-gray-900">
              SAR {Number(receipt.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2
              border border-gray-300 text-gray-700 px-4 py-2 rounded-lg
              text-sm hover:bg-gray-50 transition-colors"
          >
            <Printer size={15} />
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white
              px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            New Sale
          </button>
        </div>
      </div>
    </div>
  )
}