interface Props {
  percentage: number
  isLow:      boolean
  isCritical: boolean
}

export default function TankLevelGauge({ percentage, isLow, isCritical }: Props) {
  // SVG arc math for circular gauge
  const radius      = 36
  const stroke      = 7
  const normalised  = Math.min(100, Math.max(0, percentage))
  const circumference = 2 * Math.PI * radius
  const arc         = circumference * 0.75          // 270° sweep
  const offset      = arc - (normalised / 100) * arc

  const trackColor = isCritical
    ? '#FEE2E2'
    : isLow
    ? '#FEF3C7'
    : '#F0FDF4'

  const fillColor = isCritical
    ? '#EF4444'
    : isLow
    ? '#F59E0B'
    : '#22C55E'

  return (
    <div className="flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        {/* Background circle */}
        <circle
          cx="48" cy="48" r={radius}
          fill={trackColor}
          stroke="transparent"
        />
        {/* Track arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(135 48 48)"
        />
        {/* Fill arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={fillColor}
          strokeWidth={stroke}
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(135 48 48)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        {/* Percentage text */}
        <text
          x="48" y="44"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight="600"
          fill={fillColor}
        >
          {Math.round(normalised)}%
        </text>
        <text
          x="48" y="60"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fill="#9CA3AF"
        >
          full
        </text>
      </svg>
    </div>
  )
}