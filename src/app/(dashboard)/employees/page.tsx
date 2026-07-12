import { prisma }         from '@/lib/prisma'
import EmployeeCard       from '@/components/employees/EmployeeCard'
import AddEmployeeForm    from '@/components/employees/AddEmployeeForm'
import { Users }          from 'lucide-react'

export default async function EmployeesPage() {
  const employees = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { sales: true } },
      shifts: {
        where:   { status: 'ACTIVE' },
        select:  { id: true, startTime: true, openingCash: true },
        take:    1,
      },
    },
  })

  const activeCount   = employees.filter(e => e.isActive).length
  const onShiftCount  = employees.filter(e => e.shifts.length > 0).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {employees.length} staff members
          </p>
        </div>
        <AddEmployeeForm />
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total staff',  value: employees.length,  color: 'text-gray-800'  },
          { label: 'Active',       value: activeCount,        color: 'text-green-600' },
          { label: 'On shift now', value: onShiftCount,       color: 'text-amber-600' },
        ].map(item => (
          <div key={item.label}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3
              text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Employee grid */}
      {employees.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No employees yet. Add your first staff member.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {employees.map(emp => (
            <EmployeeCard key={emp.id} employee={emp as any} />
          ))}
        </div>
      )}
    </div>
  )
}