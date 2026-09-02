'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, CalendarDays, CheckCircle2, Fuel, Square } from 'lucide-react'
import {
  closeBusinessDayAction,
  closeStationShiftAction,
  emergencyCloseStationShiftAction,
  openBusinessDayAction,
  openStationShiftAction,
} from '@/app/actions/station-shift.actions'
import type { StationShiftPageData } from '@/lib/station-shifts/types'

type Props = {
  data: StationShiftPageData
  canManageBusinessDay: boolean
  canEmergencyClose: boolean
}

function riyadhToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default function StationShiftManager({
  data,
  canManageBusinessDay,
  canEmergencyClose,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [businessDate, setBusinessDate] = useState(riyadhToday())
  const [openingCash, setOpeningCash] = useState('0.00')
  const [closingCash, setClosingCash] = useState('0.00')
  const [emergencyReason, setEmergencyReason] = useState('')
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [readings, setReadings] = useState<Record<string, { closing: string; test: string; adjustment: string }>>({})

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setMessage(null)
    startTransition(async () => {
      const result = await action()
      setMessage(result.success ? 'Operation completed successfully' : result.error ?? 'Operation failed')
      if (result.success) router.refresh()
    })
  }

  if (!data.branch) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">No active branch is available.</div>
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm">
          <CheckCircle2 size={17} className="text-green-600" /> {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-gray-400">Branch</p>
          <p className="mt-2 font-semibold">{data.branch.nameEn}</p>
          <p className="text-sm text-gray-500">{data.branch.branchCode}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-gray-400">Business day</p>
          <p className="mt-2 font-semibold">{data.businessDay?.businessDate ?? 'Not open'}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs uppercase text-gray-400">Station shift</p>
          <p className="mt-2 font-semibold">{data.activeShift ? `Shift ${data.activeShift.shiftNumber}` : 'Not open'}</p>
        </div>
      </div>

      {!data.businessDay && canManageBusinessDay && (
        <section className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-2"><CalendarDays className="text-amber-600" /><h2 className="font-semibold">Open business day</h2></div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input type="date" value={businessDate} onChange={event => setBusinessDate(event.target.value)} className="rounded-lg border px-3 py-2" />
            <button disabled={isPending} onClick={() => run(() => openBusinessDayAction({ businessDate }))} className="rounded-lg bg-amber-500 px-4 py-2 font-medium">Open day</button>
          </div>
        </section>
      )}

      {data.businessDay && !data.activeShift && (
        <section className="rounded-xl border bg-white p-5">
          <div className="flex items-center gap-2"><Fuel className="text-amber-600" /><h2 className="font-semibold">Open station shift</h2></div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-400"><th className="pb-2">Nozzle</th><th className="pb-2">Fuel</th><th className="pb-2">Opening meter</th><th className="pb-2">Unit price</th></tr></thead>
              <tbody>
                {data.nozzles.map(nozzle => (
                  <tr key={nozzle.id} className="border-b border-gray-100">
                    <td className="py-3">D{nozzle.dispenserNumber} / N{nozzle.nozzleNumber}</td>
                    <td>{nozzle.fuelType.replaceAll('_', ' ')}</td>
                    <td>{nozzle.currentReading}</td>
                    <td><input type="number" step="0.001" min="0.001" value={prices[nozzle.id] ?? ''} onChange={event => setPrices(current => ({ ...current, [nozzle.id]: event.target.value }))} className="w-28 rounded-lg border px-2 py-1.5" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input type="number" min="0" step="0.01" value={openingCash} onChange={event => setOpeningCash(event.target.value)} className="rounded-lg border px-3 py-2" placeholder="Opening cash" />
            <button disabled={isPending} onClick={() => run(() => openStationShiftAction({ openingCash, nozzlePrices: data.nozzles.map(nozzle => ({ nozzleId: nozzle.id, unitPrice: prices[nozzle.id] ?? '' })) }))} className="rounded-lg bg-gray-900 px-4 py-2 text-white">Open shift</button>
            {canManageBusinessDay && data.businessDay.shiftCount > 0 && (
              <button disabled={isPending} onClick={() => run(() => closeBusinessDayAction({ businessDayId: data.businessDay!.id }))} className="rounded-lg border px-4 py-2">Close business day</button>
            )}
          </div>
        </section>
      )}

      {data.activeShift && (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Close shift {data.activeShift.shiftNumber}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-400"><th className="pb-2">Nozzle</th><th className="pb-2">Opening</th><th className="pb-2">Closing</th><th className="pb-2">Test L</th><th className="pb-2">Adjustment L</th></tr></thead>
              <tbody>
                {data.activeShift.readings.map(reading => {
                  const state = readings[reading.id] ?? { closing: reading.openingReading, test: '0', adjustment: '0' }
                  return (
                    <tr key={reading.id} className="border-b border-gray-100">
                      <td className="py-3">D{reading.dispenserNumber} / N{reading.nozzleNumber}</td>
                      <td>{reading.openingReading}</td>
                      {(['closing', 'test', 'adjustment'] as const).map(field => (
                        <td key={field}><input type="number" step="0.001" value={state[field]} onChange={event => setReadings(current => ({ ...current, [reading.id]: { ...state, [field]: event.target.value } }))} className="w-28 rounded-lg border px-2 py-1.5" /></td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <input type="number" min="0" step="0.01" value={closingCash} onChange={event => setClosingCash(event.target.value)} className="rounded-lg border px-3 py-2" placeholder="Closing cash" />
            <button disabled={isPending} onClick={() => run(() => closeStationShiftAction({ shiftId: data.activeShift!.id, closingCash, readings: data.activeShift!.readings.map(reading => ({ readingId: reading.id, closingReading: (readings[reading.id] ?? { closing: reading.openingReading }).closing, testLitres: (readings[reading.id] ?? { test: '0' }).test ?? '0', adjustmentLitres: (readings[reading.id] ?? { adjustment: '0' }).adjustment ?? '0' })) }))} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white"><Square size={15} /> Close shift</button>
            {canEmergencyClose && (
              <><input value={emergencyReason} onChange={event => setEmergencyReason(event.target.value)} className="min-w-72 rounded-lg border border-red-200 px-3 py-2" placeholder="Emergency reason" /><button disabled={isPending} onClick={() => run(() => emergencyCloseStationShiftAction({ shiftId: data.activeShift!.id, closingCash, emergencyReason, readings: data.activeShift!.readings.map(reading => ({ readingId: reading.id, closingReading: (readings[reading.id] ?? { closing: reading.openingReading }).closing, testLitres: (readings[reading.id] ?? { test: '0' }).test ?? '0', adjustmentLitres: (readings[reading.id] ?? { adjustment: '0' }).adjustment ?? '0' })) }))} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-red-700"><AlertTriangle size={16} /> Emergency close</button></>
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border bg-white p-5">
        <h2 className="font-semibold">Recent station shifts</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-400"><th className="pb-2">Day / shift</th><th className="pb-2">Litres</th><th className="pb-2">Amount</th><th className="pb-2">Status</th></tr></thead><tbody>{data.recentShifts.map(shift => <tr key={shift.id} className="border-b border-gray-100"><td className="py-3">{shift.businessDate} / {shift.shiftNumber}</td><td>{shift.meterSalesLitres}</td><td>SAR {shift.meterSalesAmount}</td><td>{shift.status.replaceAll('_', ' ')}</td></tr>)}</tbody></table>
        </div>
      </section>
    </div>
  )
}
