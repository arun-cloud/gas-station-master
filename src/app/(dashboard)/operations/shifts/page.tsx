import { Gauge, Layers3 } from 'lucide-react'
import StationShiftManager from '@/components/operations/shifts/StationShiftManager'
import { requireUser } from '@/lib/rbac'
import { getStationShiftPageData } from '@/lib/services/station-shift-service'

export default async function StationShiftsPage() {
  const user = await requireUser()
  const data = await getStationShiftPageData()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
            <Layers3 size={17} /> Phase 5A and 5B
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-800">Station Shifts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Business-day control, station-level shifts and nozzle meter sales.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          <Gauge size={17} className="text-amber-600" />
          Meter formula: closing − opening − test + adjustment
        </div>
      </div>

      <StationShiftManager
        key={`${data.businessDay?.id ?? 'no-day'}:${data.activeShift?.id ?? 'no-shift'}`}
        data={data}
        canManageBusinessDay={user.role === 'ADMIN' || user.role === 'MANAGER'}
        canEmergencyClose={user.role === 'ADMIN' || user.role === 'MANAGER'}
      />
    </div>
  )
}
