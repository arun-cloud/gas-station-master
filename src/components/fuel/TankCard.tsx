import TankLevelGauge from './TankLevelGauge'
import { AlertTriangle } from 'lucide-react'

interface Tank {
  id:           string
  tankNumber:   number
  fuelType:     string
  capacity:     number | any
  currentLevel: number | any
  minLevel:     number | any
}

const fuelLabels: Record<string, { label: string; color: string }> = {
  PETROL_91:      { label: 'Petrol 91',      color: 'bg-blue-100   text-blue-700'   },
  PETROL_95:      { label: 'Petrol 95',      color: 'bg-indigo-100 text-indigo-700' },
  DIESEL:         { label: 'Diesel',         color: 'bg-yellow-100 text-yellow-700' },
  PREMIUM_DIESEL: { label: 'Premium Diesel', color: 'bg-orange-100 text-orange-700' },
}

export default function TankCard({ tank }: { tank: Tank }) {
  const capacity     = Number(tank.capacity)
  const currentLevel = Number(tank.currentLevel)
  const minLevel     = Number(tank.minLevel)
  const percentage   = Math.round((currentLevel / capacity) * 100)
  const isLow        = currentLevel <= minLevel * 1.5   // within 150% of min
  const isCritical   = currentLevel <= minLevel         // at or below min
  const available    = capacity - currentLevel          // space remaining

  const fuel = fuelLabels[tank.fuelType] ?? {
    label: tank.fuelType,
    color: 'bg-gray-100 text-gray-600'
  }

  return (
    <div className={`bg-white rounded-xl border p-5
      ${isCritical
        ? 'border-red-300 ring-1 ring-red-200'
        : isLow
        ? 'border-amber-300'
        : 'border-gray-200'}`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-lg font-bold text-gray-800">
            Tank #{tank.tankNumber}
          </p>
          <span className={`text-xs font-medium px-2 py-0.5
            rounded-full ${fuel.color}`}>
            {fuel.label}
          </span>
        </div>

        {/* Alert badge */}
        {isCritical && (
          <div className="flex items-center gap-1.5 bg-red-100 text-red-700
            px-2.5 py-1 rounded-full text-xs font-medium">
            <AlertTriangle size={12} />
            Critical
          </div>
        )}
        {isLow && !isCritical && (
          <div className="flex items-center gap-1.5 bg-amber-100 text-amber-700
            px-2.5 py-1 rounded-full text-xs font-medium">
            <AlertTriangle size={12} />
            Low
          </div>
        )}
      </div>

      {/* Gauge + stats side by side */}
      <div className="flex items-center gap-4">
        <TankLevelGauge
          percentage={percentage}
          isLow={isLow}
          isCritical={isCritical}
        />

        {/* Stats */}
        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current</span>
            <span className="font-medium text-gray-700">
              {currentLevel.toLocaleString()} L
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Capacity</span>
            <span className="font-medium text-gray-700">
              {capacity.toLocaleString()} L
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Available</span>
            <span className="font-medium text-gray-700">
              {available.toLocaleString()} L
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Min. level</span>
            <span className={`font-medium ${isCritical ? 'text-red-600' : 'text-gray-700'}`}>
              {minLevel.toLocaleString()} L
            </span>
          </div>
        </div>
      </div>

      {/* Alert bar at bottom when critical */}
      {isCritical && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg
          px-3 py-2 text-xs text-red-700">
          Tank is at or below minimum level. Order a delivery immediately.
        </div>
      )}
    </div>
  )
}