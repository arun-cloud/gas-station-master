'use client'

import { useState, useTransition } from 'react'
import { recordSale }              from '@/app/actions/sales.actions'
import SaleReceiptModal            from './SaleReceiptModal'
import { Fuel, CreditCard, Banknote, Star } from 'lucide-react'

interface Pump {
  id:         string
  pumpNumber: number
  fuelType:   string
  status:     string
}

interface Customer {
  id:            string
  name:          string
  phone:         string
  loyaltyPoints: number
}

interface Props {
  pumps:     Pump[]
  customers: Customer[]
  userId:    string
}

const fuelLabels: Record<string, string> = {
  PETROL_91:      'Petrol 91',
  PETROL_95:      'Petrol 95',
  DIESEL:         'Diesel',
  PREMIUM_DIESEL: 'Premium Diesel',
}

const FUEL_PRICES: Record<string, number> = {
  PETROL_91:      1.25,
  PETROL_95:      1.45,
  DIESEL:         0.75,
  PREMIUM_DIESEL: 1.75,
}

const paymentOptions = [
  { value: 'CASH',           label: 'Cash',           icon: Banknote   },
  { value: 'CARD',           label: 'Card',           icon: CreditCard },
  { value: 'LOYALTY_POINTS', label: 'Loyalty Points', icon: Star       },
]

export default function POSTerminal({ pumps, customers, userId }: Props) {
  // Form state
  const [selectedPump,    setSelectedPump]    = useState<Pump | null>(null)
  const [litres,          setLitres]          = useState('')
  const [paymentMethod,   setPaymentMethod]   = useState('CASH')
  const [customerSearch,  setCustomerSearch]  = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [error,           setError]           = useState('')
  const [receipt,         setReceipt]         = useState<any>(null)
  const [isPending,       startTransition]    = useTransition()

  // Filtered customers for search
  const filteredCustomers = customerSearch.length > 1
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
      )
    : []

  // Live calculation
  const pricePerLitre = selectedPump
    ? FUEL_PRICES[selectedPump.fuelType] ?? 0
    : 0
  const totalAmount = litres && pricePerLitre
    ? (parseFloat(litres) * pricePerLitre).toFixed(2)
    : '0.00'

  // Active pumps only
  const activePumps = pumps.filter(p => p.status === 'ACTIVE')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!selectedPump) return setError('Please select a pump')
    if (!litres || parseFloat(litres) <= 0) return setError('Enter valid litres')

    const formData = new FormData()
    formData.set('pumpId',        selectedPump.id)
    formData.set('litres',        litres)
    formData.set('paymentMethod', paymentMethod)
    formData.set('userId',        userId)
    if (selectedCustomer) formData.set('customerId', selectedCustomer.id)

    startTransition(async () => {
      const result = await recordSale(formData)
      if (result.success && result.sale) {
        setReceipt(result.sale)
        // Reset form
        setSelectedPump(null)
        setLitres('')
        setPaymentMethod('CASH')
        setSelectedCustomer(null)
        setCustomerSearch('')
      } else {
        setError(result.error ?? 'Failed to record sale')
      }
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Pump selection ───────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Pump selector */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase
              tracking-wide">
              Select Pump
            </h2>

            {activePumps.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <Fuel size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active pumps. Set a pump to Active first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {activePumps.map(pump => (
                  <button
                    key={pump.id}
                    type="button"
                    onClick={() => setSelectedPump(pump)}
                    className={`rounded-xl border-2 p-3 text-center transition-all
                      ${selectedPump?.id === pump.id
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-amber-300 bg-white'
                      }`}
                  >
                    <p className="text-lg font-bold text-gray-800">
                      #{pump.pumpNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fuelLabels[pump.fuelType] ?? pump.fuelType}
                    </p>
                    <p className="text-xs font-medium text-amber-600 mt-1">
                      SAR {FUEL_PRICES[pump.fuelType]?.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Litres input */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase
              tracking-wide">
              Litres Dispensed
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={litres}
                onChange={e => setLitres(e.target.value)}
                placeholder="0.00"
                className="flex-1 text-3xl font-bold text-gray-800 border-0
                  focus:outline-none focus:ring-0 bg-transparent"
              />
              <span className="text-xl text-gray-400 font-medium">L</span>
            </div>

            {/* Quick select buttons */}
            <div className="flex gap-2 mt-3">
              {[10, 20, 30, 50, 100].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLitres(n.toString())}
                  className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-amber-100
                    hover:text-amber-700 text-gray-600 rounded-lg transition-colors"
                >
                  {n}L
                </button>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase
              tracking-wide">
              Payment Method
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {paymentOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMethod(value)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl
                    border-2 transition-all text-sm font-medium
                    ${paymentMethod === value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-amber-300'
                    }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Customer lookup (optional) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase
              tracking-wide">
              Customer
              <span className="ml-2 text-xs font-normal text-gray-400 normal-case">
                optional — for loyalty points
              </span>
            </h2>

            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-green-50
                border border-green-200 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {selectedCustomer.name}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {selectedCustomer.phone} ·{' '}
                    {selectedCustomer.loyaltyPoints} pts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null)
                    setCustomerSearch('')
                  }}
                  className="text-green-500 hover:text-green-700 text-xs underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by name or phone…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {/* Dropdown results */}
                {filteredCustomers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1
                    bg-white border border-gray-200 rounded-lg shadow-lg z-10
                    max-h-40 overflow-y-auto">
                    {filteredCustomers.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c)
                          setCustomerSearch('')
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-amber-50
                          text-sm border-b border-gray-100 last:border-0"
                      >
                        <span className="font-medium text-gray-700">{c.name}</span>
                        <span className="text-gray-400 ml-2">{c.phone}</span>
                        <span className="text-amber-600 ml-2 text-xs">
                          {c.loyaltyPoints} pts
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Order summary ───────────────── */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-5
            sticky top-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase
              tracking-wide">
              Sale Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Pump</span>
                <span className="font-medium text-gray-700">
                  {selectedPump ? `#${selectedPump.pumpNumber}` : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fuel</span>
                <span className="font-medium text-gray-700">
                  {selectedPump
                    ? fuelLabels[selectedPump.fuelType]
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Litres</span>
                <span className="font-mono font-medium text-gray-700">
                  {litres || '0.00'} L
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Price/L</span>
                <span className="font-mono font-medium text-gray-700">
                  SAR {pricePerLitre.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment</span>
                <span className="font-medium text-gray-700">
                  {paymentOptions.find(p => p.value === paymentMethod)?.label}
                </span>
              </div>
              {selectedCustomer && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Points earned</span>
                  <span className="font-medium text-green-600">
                    +{Math.floor(parseFloat(litres) || 0)} pts
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 mt-4 pt-4 flex
              justify-between items-baseline">
              <span className="text-base font-semibold text-gray-700">Total</span>
              <span className="text-2xl font-bold text-gray-900">
                SAR {totalAmount}
              </span>
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2
                rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !selectedPump || !litres}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-40
                disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold
                text-base transition-colors"
            >
              {isPending ? 'Processing…' : 'Confirm Sale'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              Sale is final once confirmed
            </p>
          </div>
        </div>
      </form>

      {/* Receipt modal */}
      {receipt && selectedPump === null && (
        <SaleReceiptModal
          receipt={receipt}
          pumpNumber={
            pumps.find(p => p.id === receipt.pumpId)?.pumpNumber ??
            pumps[0]?.pumpNumber ?? 1
          }
          onClose={() => setReceipt(null)}
        />
      )}
      {receipt && (
        <SaleReceiptModal
          receipt={receipt}
          pumpNumber={
            pumps.find(p =>
              receipt.pumpId && p.id === receipt.pumpId
            )?.pumpNumber ?? 1
          }
          onClose={() => setReceipt(null)}
        />
      )}
    </>
  )
}