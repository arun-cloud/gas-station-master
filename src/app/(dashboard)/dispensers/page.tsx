import { requireUser } from '@/lib/rbac'
import { resolveActiveBranch } from '@/lib/branch-context'
import { prisma } from '@/lib/prisma'
import DispenserForm from '@/components/dispensers/DispenserForm'
import DispenserCard from '@/components/dispensers/DispenserCard'
import { Gauge, Building2 } from 'lucide-react'

export default async function DispensersPage() {
  const user = await requireUser()
  const { activeBranch } = await resolveActiveBranch()

  // Permission state: user is authenticated but has no accessible branch yet.
  if (!activeBranch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <Building2 size={24} className="mb-2 text-amber-600" />
        <h1 className="text-lg font-semibold text-amber-900">No branch access</h1>
        <p className="mt-1 text-sm text-amber-700">
          You don&apos;t have access to any active branch yet. Contact an administrator to be
          assigned to a branch.
        </p>
      </div>
    )
  }

  const canManage = user.role === 'ADMIN' || user.role === 'MANAGER'

  const dispensers = await prisma.dispenser.findMany({
    where: { branchId: activeBranch.id },
    include: {
      nozzles: {
        orderBy: { nozzleNumber: 'asc' },
      },
    },
    orderBy: { dispenserNumber: 'asc' },
  })

  const counts = {
    ACTIVE: dispensers.filter(d => d.isActive && d.status === 'ACTIVE').length,
    IDLE: dispensers.filter(d => d.isActive && d.status === 'IDLE').length,
    MAINTENANCE: dispensers.filter(d => d.isActive && d.status === 'MAINTENANCE').length,
    OFFLINE: dispensers.filter(d => !d.isActive || d.status === 'OFFLINE').length,
  }

  const summaries = [
    { label: 'Active', count: counts.ACTIVE, color: 'bg-green-100 text-green-700' },
    { label: 'Idle', count: counts.IDLE, color: 'bg-gray-100 text-gray-600' },
    { label: 'Maintenance', count: counts.MAINTENANCE, color: 'bg-amber-100 text-amber-700' },
    { label: 'Offline', count: counts.OFFLINE, color: 'bg-red-100 text-red-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dispensers Management</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {dispensers.length} dispensers total · {activeBranch.nameEn}
          </p>
        </div>

        {canManage ? <DispenserForm branchId={activeBranch.id} /> : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaries.map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="text-sm text-gray-500">{item.label}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${item.color}`}>
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {dispensers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Gauge size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {canManage
              ? 'No dispensers yet. Add your first dispenser above.'
              : 'No dispensers configured for this branch yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dispensers.map(dispenser => (
            <DispenserCard key={dispenser.id} dispenser={dispenser} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
