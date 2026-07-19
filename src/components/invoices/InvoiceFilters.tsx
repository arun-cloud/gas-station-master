'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'

export default function InvoiceFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [from, setFrom] = useState(searchParams.get('from') ?? '')
  const [to, setTo] = useState(searchParams.get('to') ?? '')
  const [receiptType, setReceiptType] = useState(searchParams.get('receiptType') ?? 'ALL')
  const [paymentType, setPaymentType] = useState(searchParams.get('paymentType') ?? '')
  const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') ?? '')
  const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') ?? '')

  function applyFilters(overrides: Record<string, string> = {}) {
    const values: Record<string, string> = {
      q,
      from,
      to,
      receiptType,
      paymentType,
      minAmount,
      maxAmount,
      ...overrides,
    }

    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(values)) {
      if (value && value !== 'ALL') params.set(key, value)
    }
    // Any filter change resets pagination back to page 1.

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleReset() {
    setQ('')
    setFrom('')
    setTo('')
    setReceiptType('ALL')
    setPaymentType('')
    setMinAmount('')
    setMaxAmount('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters = Boolean(
    searchParams.get('q') ||
      searchParams.get('from') ||
      searchParams.get('to') ||
      searchParams.get('paymentType') ||
      searchParams.get('minAmount') ||
      searchParams.get('maxAmount') ||
      (searchParams.get('receiptType') && searchParams.get('receiptType') !== 'ALL'),
  )

  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        applyFilters()
      }}
      className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
    >
      <div className="lg:col-span-2">
        <label className="mb-1 block text-xs font-medium text-gray-500">
          Receipt / order number
        </label>
        <div className="relative">
          <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Type</label>
        <select
          value={receiptType}
          onChange={e => setReceiptType(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        >
          <option value="ALL">All</option>
          <option value="SALE">Sale</option>
          <option value="REFUND">Refund</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Payment type</label>
        <input
          value={paymentType}
          onChange={e => setPaymentType(e.target.value)}
          placeholder="e.g. Cash"
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Min amount</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={minAmount}
          onChange={e => setMinAmount(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Max amount</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={maxAmount}
          onChange={e => setMaxAmount(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-1.5 px-2 text-sm focus:border-gray-500 focus:outline-none"
        />
      </div>

      <div className="flex items-end gap-2 lg:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-gray-900 hover:bg-amber-400 disabled:opacity-60"
        >
          Apply filters
        </button>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <X size={14} />
            Clear
          </button>
        ) : null}
      </div>
    </form>
  )
}
