import { requireUser } from '@/lib/rbac'
import { resolveActiveBranch } from '@/lib/branch-context'
import { prisma } from '@/lib/prisma'
import TankForm from '@/components/tanks/TankForm'
import TankCard from '@/components/fuel/TankCard'
import { Fuel, AlertTriangle, Building2 } from 'lucide-react'

export default async function FuelInventoryPage() {
  const user = await requireUser()
  const { activeBranch } = await resolveActiveBranch()

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

  const tanks = await prisma.fuelTank.findMany({
    where: { branchId: activeBranch.id },
    orderBy: { tankNumber: 'asc' },
  })

  const activeTanks = tanks.filter(tank => tank.isActive)

  const criticalTanks = activeTanks.filter(tank => Number(tank.currentLevel) <= Number(tank.minLevel))
  const lowTanks = activeTanks.filter(
    tank =>
      Number(tank.currentLevel) <= Number(tank.minLevel) * 1.5 &&
      Number(tank.currentLevel) > Number(tank.minLevel),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fuel Tanks</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {tanks.length} tanks configured · {activeBranch.nameEn}
          </p>
        </div>

        {canManage ? <TankForm mode="create" branchId={activeBranch.id} /> : null}
      </div>

      {/* Critical alerts */}
      {criticalTanks.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {criticalTanks.length} tank{criticalTanks.length > 1 ? 's' : ''} at critical level
            </p>
            <p className="mt-0.5 text-sm text-red-600">
              {criticalTanks.map(tank => `Tank #${tank.tankNumber}`).join(', ')} — a delivery
              record will be needed once Phase 7 (Deliveries) is available.
            </p>
          </div>
        </div>
      )}

      {lowTanks.length > 0 && criticalTanks.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lowTanks.length} tank{lowTanks.length > 1 ? 's' : ''} running low
            </p>
            <p className="mt-0.5 text-sm text-amber-600">
              {lowTanks.map(tank => `Tank #${tank.tankNumber}`).join(', ')} — keep an eye on these.
            </p>
          </div>
        </div>
      )}

      {tanks.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Fuel size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            {canManage
              ? 'No tanks configured yet. Add your first tank above.'
              : 'No tanks configured for this branch yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tanks.map(tank => (
            <TankCard key={tank.id} tank={tank} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  )
}
