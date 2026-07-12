import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title:    string
  value:    string | number
  subtitle: string
  icon:     LucideIcon
  color:    'amber' | 'green' | 'blue' | 'red'
}

const colorMap = {
  amber: 'bg-amber-100 text-amber-600',
  green: 'bg-green-100 text-green-600',
  blue:  'bg-blue-100  text-blue-600',
  red:   'bg-red-100   text-red-600',
}

export default function StatCard({
  title, value, subtitle, icon: Icon, color
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${colorMap[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold text-gray-800 mt-0.5">{value}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}