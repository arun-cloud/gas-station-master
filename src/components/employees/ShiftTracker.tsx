'use client'

import { useState, useTransition } from 'react'
import { clockIn, clockOut }       from '@/app/actions/employee.actions'
import { Clock, LogIn, LogOut }    from 'lucide-react'

interface ActiveShift {
  id:          string
  startTime:   Date
  openingCash: number | any
}

interface Props {
  userId:      string
  employeeName: string
  activeShift: ActiveShift | null
}

function formatDuration(start: Date) {
  const ms      = Date.now() - new Date(start).getTime()
  const hours   = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export default function ShiftTracker({
  userId, employeeName, activeShift
}: Props) {
  const [open,        setOpen]        = useState(false)
  const [mode,        setMode]        = useState<'in' | 'out'>('in')
  const [cash,        setCash]        = useState('')
  const [notes,       setNotes]       = useState('')
  const [error,       setError]       = useState('')
  const [isPending,   startTransition] = useTransition()

  function openClockIn() {
    setMode('in')
    setCash('')
    setNotes('')
    setError('')
    setOpen(true)
  }

  function openClockOut() {
    setMode('out')
    setCash('')
    setNotes('')
    setError('')
    setOpen(true)
  }

  async function handleSubmit() {
    if (!cash || isNaN(Number(cash))) {
      setError('Enter a valid cash amount')
      return
    }
    setError('')

    startTransition(async () => {
      let result
      if (mode === 'in') {
        result = await clockIn(userId, Number(cash))
      } else {
        result = await clockOut(activeShift!.id, Number(cash), notes)
      }

      if (result.success) {
        setOpen(false)
      } else {
        setError(result.error ?? 'Failed')
      }
    })
  }

  return (
    <>
      {activeShift ? (
        <div className="flex items-center gap-2">
          {/* Active shift indicator */}
          <div className="flex items-center gap-1.5 bg-green-100 text-green-700
            px-2.5 py-1 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full
              animate-pulse" />
            {formatDuration(activeShift.startTime)}
          </div>
          <button
            onClick={openClockOut}
            className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200
              text-red-700 px-2.5 py-1 rounded-full text-xs font-medium
              transition-colors"
          >
            <LogOut size={11} />
            Clock Out
          </button>
        </div>
      ) : (
        <button
          onClick={openClockIn}
          className="flex items-center gap-1.5 bg-gray-100 hover:bg-green-100
            text-gray-600 hover:text-green-700 px-2.5 py-1 rounded-full
            text-xs font-medium transition-colors"
        >
          <LogIn size={11} />
          Clock In
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center
          justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">

            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-lg ${
                mode === 'in' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Clock size={18} className={
                  mode === 'in' ? 'text-green-600' : 'text-red-600'
                } />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  {mode === 'in' ? 'Clock In' : 'Clock Out'}
                </h2>
                <p className="text-xs text-gray-400">{employeeName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {mode === 'in' ? 'Opening Cash (SAR)' : 'Closing Cash (SAR)'}
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={cash}
                  onChange={e => setCash(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg
                    text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {mode === 'out' && (
                <>
                  {/* Show shift duration */}
                  {activeShift && (
                    <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Shift started</span>
                        <span className="font-medium">
                          {new Date(activeShift.startTime).toLocaleTimeString(
                            'en-SA', { hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600 mt-1">
                        <span>Duration</span>
                        <span className="font-medium">
                          {formatDuration(activeShift.startTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600 mt-1">
                        <span>Opening cash</span>
                        <span className="font-medium">
                          SAR {Number(activeShift.openingCash).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes{' '}
                      <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Any handover notes…"
                      className="w-full px-3 py-2 border border-gray-300
                        rounded-lg text-sm focus:outline-none
                        focus:ring-2 focus:ring-amber-500 resize-none"
                    />
                  </div>
                </>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2
                  rounded-lg">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-300
                    rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 text-sm text-white rounded-lg
                    font-medium transition-colors disabled:opacity-50
                    ${mode === 'in'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-500 hover:bg-red-600'
                    }`}
                >
                  {isPending
                    ? 'Saving…'
                    : mode === 'in' ? 'Clock In' : 'Clock Out'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}