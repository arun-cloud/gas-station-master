import { Fuel } from 'lucide-react'
import DispenserStatusButton from './DispenserStatusButton'
import AddNozzleForm from './AddNozzleForm'
import ActiveToggle from '@/components/shared/ActiveToggle'
import { setDispenserActive } from '@/app/actions/dispenser.actions'
import { setNozzleActive } from '@/app/actions/nozzle.actions'
import type { Prisma } from '../../../prisma/generated/client'

type DispenserWithNozzles = Prisma.DispenserGetPayload<{
  include: { nozzles: true }
}>

type DispenserCardProps = {
  dispenser: DispenserWithNozzles
  canManage: boolean
}

const fuelLabels: Record<string, { label: string; color: string }> = {
  PETROL_91: { label: 'Petrol 91', color: 'bg-blue-100 text-blue-700' },
  PETROL_95: { label: 'Petrol 95', color: 'bg-indigo-100 text-indigo-700' },
  DIESEL: { label: 'Diesel', color: 'bg-yellow-100 text-yellow-700' },
  PREMIUM_DIESEL: { label: 'Premium Diesel', color: 'bg-orange-100 text-orange-700' },
}

const borderColor: Record<string, string> = {
  ACTIVE: 'border-l-green-500',
  IDLE: 'border-l-gray-300',
  MAINTENANCE: 'border-l-amber-500',
  OFFLINE: 'border-l-red-500',
}

export default function DispenserCard({ dispenser, canManage }: DispenserCardProps) {
  const statusBorder = dispenser.isActive
    ? (borderColor[dispenser.status] ?? borderColor.IDLE)
    : 'border-l-gray-200'

  const activeNozzles = dispenser.nozzles.filter(nozzle => nozzle.isActive)
  const nextNozzleNumber =
    dispenser.nozzles.reduce((max, nozzle) => Math.max(max, nozzle.nozzleNumber), 0) + 1

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border border-l-4 border-gray-200 bg-white p-5 ${statusBorder} ${
        dispenser.isActive ? '' : 'opacity-60'
      }`}
    >
      {/* Dispenser header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2.5">
            <Fuel size={20} className="text-gray-600" />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Dispenser
            </p>
            <h2 className="text-lg font-bold text-gray-800">#{dispenser.dispenserNumber}</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {activeNozzles.length} {activeNozzles.length === 1 ? 'nozzle' : 'nozzles'}
              {!dispenser.isActive ? ' · Decommissioned' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {canManage ? (
            <DispenserStatusButton dispenserId={dispenser.id} currentStatus={dispenser.status} />
          ) : (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
              {dispenser.status}
            </span>
          )}

          {canManage ? (
            <ActiveToggle
              id={dispenser.id}
              isActive={dispenser.isActive}
              action={setDispenserActive}
              confirmDisableMessage="Decommission this dispenser? It will be hidden from active use but its sales history is preserved."
            />
          ) : null}
        </div>
      </div>

      {/* Nozzles */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        {dispenser.nozzles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center">
            <p className="text-sm text-gray-500">No nozzles configured for this dispenser.</p>
          </div>
        ) : (
          dispenser.nozzles.map(nozzle => {
            const fuel = fuelLabels[nozzle.fuelType] ?? {
              label: nozzle.fuelType,
              color: 'bg-gray-100 text-gray-600',
            }
            const reading = Number(nozzle.currentReading)

            return (
              <div
                key={nozzle.id}
                className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${
                  nozzle.isActive ? '' : 'opacity-50'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        Nozzle #{nozzle.nozzleNumber}
                      </p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fuel.color}`}>
                        {fuel.label}
                      </span>
                      {!nozzle.isActive ? (
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
                          Decommissioned
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      Totalizer: {reading.toFixed(3)} L
                    </p>
                  </div>

                  {canManage ? (
                    <ActiveToggle
                      id={nozzle.id}
                      isActive={nozzle.isActive}
                      action={setNozzleActive}
                      confirmDisableMessage="Decommission this nozzle? It will be hidden from active use but its sales history is preserved."
                      size={14}
                    />
                  ) : null}
                </div>
              </div>
            )
          })
        )}

        {canManage && dispenser.isActive ? (
          <AddNozzleForm dispenserId={dispenser.id} nextNozzleNumber={nextNozzleNumber} />
        ) : null}
      </div>
    </article>
  )
}
