import TankLevelGauge from './TankLevelGauge'
import TankForm from '@/components/tanks/TankForm'
import ActiveToggle from '@/components/shared/ActiveToggle'
import { setTankActive } from '@/app/actions/tank.actions'
import type { FuelTank } from '../../../prisma/generated/client'

type TankCardProps = {
  tank: FuelTank
  canManage: boolean
}

const fuelLabels: Record<string, { label: string; color: string }> = {
  PETROL_91: { label: 'Petrol 91', color: 'bg-blue-100 text-blue-700' },
  PETROL_95: { label: 'Petrol 95', color: 'bg-indigo-100 text-indigo-700' },
  DIESEL: { label: 'Diesel', color: 'bg-yellow-100 text-yellow-700' },
  PREMIUM_DIESEL: { label: 'Premium Diesel', color: 'bg-orange-100 text-orange-700' },
}

export default function TankCard({ tank, canManage }: TankCardProps) {
  const capacity = Number(tank.capacity)
  const currentLevel = Number(tank.currentLevel)
  const minLevel = Number(tank.minLevel)
  const percentage = capacity > 0 ? (currentLevel / capacity) * 100 : 0
  const isCritical = currentLevel <= minLevel
  const isLow = !isCritical && currentLevel <= minLevel * 1.5

  const fuel = fuelLabels[tank.fuelType] ?? {
    label: tank.fuelType,
    color: 'bg-gray-100 text-gray-600',
  }

  return (
    <article
      className={`flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 ${
        tank.isActive ? '' : 'opacity-60'
      }`}
    >
      <TankLevelGauge percentage={percentage} isLow={isLow} isCritical={isCritical} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Tank</p>
            <h2 className="text-lg font-bold text-gray-800">#{tank.tankNumber}</h2>
          </div>

          {canManage ? (
            <div className="flex items-center gap-1">
              <TankForm
                mode="edit"
                branchId={tank.branchId}
                tank={{
                  id: tank.id,
                  tankNumber: String(tank.tankNumber),
                  fuelType: tank.fuelType,
                  capacity: String(capacity),
                  currentLevel: String(currentLevel),
                  minLevel: String(minLevel),
                }}
              />
              <ActiveToggle
                id={tank.id}
                isActive={tank.isActive}
                action={setTankActive}
                confirmDisableMessage="Decommission this tank? It will be hidden from active use but delivery history is preserved."
              />
            </div>
          ) : null}
        </div>

        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${fuel.color}`}>
          {fuel.label}
        </span>

        <p className="mt-2 text-sm text-gray-600">
          {currentLevel.toLocaleString()} / {capacity.toLocaleString()} L
        </p>
        <p className="text-xs text-gray-400">Alert threshold: {minLevel.toLocaleString()} L</p>

        {!tank.isActive ? (
          <span className="mt-2 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
            Decommissioned
          </span>
        ) : null}
      </div>
    </article>
  )
}
