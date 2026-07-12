interface ShiftRow {
  id:          string
  startTime:   Date
  endTime:     Date | null
  status:      string
  openingCash: any
  closingCash: any
  notes:       string | null
  user:        { name: string; role: string }
}

function calcDuration(start: Date, end: Date | null) {
  if (!end) return 'Active'
  const ms      = new Date(end).getTime() - new Date(start).getTime()
  const hours   = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}m`
}

export default function ShiftHistoryTable({
  shifts
}: {
  shifts: ShiftRow[]
}) {
  if (shifts.length === 0) {
    return (
      <p className="text-center py-8 text-sm text-gray-400">
        No shifts recorded yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {['Employee', 'Date', 'Clock In', 'Clock Out',
              'Duration', 'Opening', 'Closing', 'Variance', 'Status'].map(h => (
              <th key={h}
                className="text-left text-xs font-medium text-gray-400
                  uppercase tracking-wide pb-3 pr-4 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {shifts.map(shift => {
            const opening  = Number(shift.openingCash)
            const closing  = shift.closingCash ? Number(shift.closingCash) : null
            const variance = closing !== null ? closing - opening : null

            return (
              <tr key={shift.id} className="hover:bg-gray-50">
                <td className="py-3 pr-4 font-medium text-gray-700">
                  {shift.user.name}
                </td>
                <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                  {new Date(shift.startTime).toLocaleDateString('en-SA', {
                    day: '2-digit', month: 'short'
                  })}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-600">
                  {new Date(shift.startTime).toLocaleTimeString('en-SA', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-600">
                  {shift.endTime
                    ? new Date(shift.endTime).toLocaleTimeString('en-SA', {
                        hour: '2-digit', minute: '2-digit'
                      })
                    : '—'
                  }
                </td>
                <td className="py-3 pr-4 text-gray-600">
                  {calcDuration(shift.startTime, shift.endTime)}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-600">
                  SAR {opening.toFixed(2)}
                </td>
                <td className="py-3 pr-4 font-mono text-gray-600">
                  {closing !== null ? `SAR ${closing.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 pr-4 font-mono">
                  {variance !== null ? (
                    <span className={
                      variance > 0 ? 'text-green-600' :
                      variance < 0 ? 'text-red-600'   : 'text-gray-500'
                    }>
                      {variance > 0 ? '+' : ''}
                      SAR {variance.toFixed(2)}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${shift.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100  text-gray-500'
                    }`}>
                    {shift.status}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}