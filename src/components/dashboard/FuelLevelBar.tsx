interface FuelLevelBarProps {
  fuelType:     string
  currentLevel: number
  capacity:     number
  minLevel:     number
}

export default function FuelLevelBar({
  fuelType, currentLevel, capacity, minLevel
}: FuelLevelBarProps) {
  const percentage = Math.round((currentLevel / capacity) * 100)
  const isLow      = currentLevel <= minLevel

  const barColor = isLow
    ? 'bg-red-500'
    : percentage > 60
    ? 'bg-green-500'
    : 'bg-amber-500'

  const fuelLabels: Record<string, string> = {
    PETROL_91:      'Petrol 91',
    PETROL_95:      'Petrol 95',
    DIESEL:         'Diesel',
    PREMIUM_DIESEL: 'Premium Diesel',
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">
          {fuelLabels[fuelType] ?? fuelType}
        </span>
        <div className="flex items-center gap-2">
          {isLow && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              Low
            </span>
          )}
          <span className="text-sm text-gray-500">
            {currentLevel.toLocaleString()} / {capacity.toLocaleString()} L
          </span>
        </div>
      </div>

      {/* Progress bar track */}
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 text-right">{percentage}% full</p>
    </div>
  )
}