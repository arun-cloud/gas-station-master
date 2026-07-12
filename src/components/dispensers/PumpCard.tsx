import { Fuel } from 'lucide-react'
import PumpStatusButton from './PumpStatusButton'
import PumpReadingInput from './PumpReadingInput'
import type { Prisma } from '../../../prisma/generated/client'

type PumpWithNozzles =
  Prisma.DispenserGetPayload<{
    include: {
      nozzles: true
    }
  }>

type PumpCardProps = {
  pump: PumpWithNozzles
}

const fuelLabels: Record<
  string,
  {
    label: string
    color: string
  }
> = {
  PETROL_91: {
    label: 'Petrol 91',
    color: 'bg-blue-100 text-blue-700',
  },
  PETROL_95: {
    label: 'Petrol 95',
    color: 'bg-indigo-100 text-indigo-700',
  },
  DIESEL: {
    label: 'Diesel',
    color: 'bg-yellow-100 text-yellow-700',
  },
  PREMIUM_DIESEL: {
    label: 'Premium Diesel',
    color: 'bg-orange-100 text-orange-700',
  },
}

const borderColor: Record<string, string> = {
  ACTIVE: 'border-l-green-500',
  IDLE: 'border-l-gray-300',
  MAINTENANCE: 'border-l-amber-500',
  OFFLINE: 'border-l-red-500',
}

export default function PumpCard({
  pump,
}: PumpCardProps) {
  const statusBorder =
    borderColor[pump.status] ??
    borderColor.IDLE

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border border-l-4 border-gray-200 bg-white p-5 ${statusBorder}`}
    >
      {/* Dispenser header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2.5">
            <Fuel
              size={20}
              className="text-gray-600"
            />
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Dispenser
            </p>

            <h2 className="text-lg font-bold text-gray-800">
              #{pump.dispenserNumber}
            </h2>

            <p className="mt-0.5 text-xs text-gray-500">
              {pump.nozzles.length}{' '}
              {pump.nozzles.length === 1
                ? 'nozzle'
                : 'nozzles'}
            </p>
          </div>
        </div>

        <PumpStatusButton
          pumpId={pump.id}
          currentStatus={pump.status}
        />
      </div>

      {/* Nozzles */}
      <div className="space-y-3 border-t border-gray-100 pt-4">
        {pump.nozzles.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-5 text-center">
            <p className="text-sm text-gray-500">
              No nozzles configured for this
              dispenser.
            </p>
          </div>
        ) : (
          pump.nozzles.map(nozzle => {
            const fuel =
              fuelLabels[nozzle.fuelType] ?? {
                label: nozzle.fuelType,
                color:
                  'bg-gray-100 text-gray-600',
              }

            const reading = Number(
              nozzle.currentReading,
            )

            return (
              <div
                key={nozzle.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">
                        Nozzle #{nozzle.nozzleNumber}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${fuel.color}`}
                      >
                        {fuel.label}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-400">
                      Cumulative totalizer reading
                    </p>
                  </div>

                  <PumpReadingInput
                    nozzleId={nozzle.id}
                    reading={reading}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </article>
  )
}