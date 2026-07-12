import ShiftTracker          from './ShiftTracker'
import { toggleEmployeeStatus } from '@/app/actions/employee.actions'
import { Mail, Shield }      from 'lucide-react'

interface Shift {
  id:          string
  startTime:   Date
  openingCash: any
}

interface Employee {
  id:          string
  name:        string
  email:       string
  role:        string
  isActive:    boolean
  shifts:      Shift[]
  _count:      { sales: number }
}

const roleConfig: Record<string, { label: string; color: string }> = {
  ADMIN:   { label: 'Admin',   color: 'bg-purple-100 text-purple-700' },
  MANAGER: { label: 'Manager', color: 'bg-blue-100   text-blue-700'   },
  CASHIER: { label: 'Cashier', color: 'bg-gray-100   text-gray-600'   },
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const avatarColors = [
  'bg-amber-500', 'bg-blue-500', 'bg-green-500',
  'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
]

export default function EmployeeCard({ employee }: { employee: Employee }) {
  const activeShift = employee.shifts.find(s => s)  ?? null
  const role        = roleConfig[employee.role] ?? { label: employee.role, color: 'bg-gray-100 text-gray-600' }
  const avatarColor = avatarColors[
    employee.name.charCodeAt(0) % avatarColors.length
  ]

  return (
    <div className={`bg-white rounded-xl border p-5 transition-opacity
      ${employee.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-full ${avatarColor} flex
            items-center justify-center text-white font-bold text-sm shrink-0`}>
            {getInitials(employee.name)}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{employee.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield size={11} className="text-gray-400" />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${role.color}`}>
                {role.label}
              </span>
            </div>
          </div>
        </div>

        {/* Active toggle */}
        <form action={async () => {
          'use server'
          // inline server action — toggles active status
        }}>
          <button
            formAction={async () => {
              'use server'
              await toggleEmployeeStatus(employee.id, !employee.isActive)
            }}
            className={`text-xs px-2.5 py-1 rounded-full font-medium
              transition-colors cursor-pointer
              ${employee.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
          >
            {employee.isActive ? 'Active' : 'Inactive'}
          </button>
        </form>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Mail size={12} />
        {employee.email}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between pt-3
        border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {employee._count.sales}
          </p>
          <p className="text-xs text-gray-400">Sales</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700">
            {employee.shifts.length > 0 ? 'On shift' : 'Off shift'}
          </p>
          <p className="text-xs text-gray-400">Status</p>
        </div>
        <ShiftTracker
          userId={employee.id}
          employeeName={employee.name}
          activeShift={activeShift as any}
        />
      </div>
    </div>
  )
}