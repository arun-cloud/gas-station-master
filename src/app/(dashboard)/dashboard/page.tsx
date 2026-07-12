import { prisma } from '@/lib/prisma'
import StatCard from '@/components/dashboard/StatCard'
import FuelLevelBar from '@/components/dashboard/FuelLevelBar'
import {
  Gauge,
  ShoppingCart,
  Fuel,
  Users,
} from 'lucide-react'

const fuelShort: Record<string, string> = {
  PETROL_91: 'P91',
  PETROL_95: 'P95',
  DIESEL: 'DSL',
  PREMIUM_DIESEL: 'PRD',
}

const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  IDLE: 'bg-gray-100 text-gray-600 border-gray-200',
  MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
  OFFLINE: 'bg-red-100 text-red-700 border-red-200',
}

export default async function DashboardPage() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const [
    dispensers,
    tanks,
    salesSummary,
    activeEmployees,
  ] = await Promise.all([
    prisma.dispenser.findMany({
      orderBy: {
        dispenserNumber: 'asc',
      },
      include: {
        nozzles: {
          select: {
            id: true,
            nozzleNumber: true,
            fuelType: true,
          },
          orderBy: {
            nozzleNumber: 'asc',
          },
        },
      },
    }),

    prisma.fuelTank.findMany({
      orderBy: {
        tankNumber: 'asc',
      },
    }),

    prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart,
        },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.user.count({
      where: {
        isActive: true,
      },
    }),
  ])

  const activeDispensers = dispensers.filter(
    dispenser => dispenser.status === 'ACTIVE',
  ).length

  const todayRevenue = Number(
    salesSummary._sum.totalAmount ?? 0,
  )

  const todayTransactions = salesSummary._count._all

  const lowTanks = tanks.filter(
    tank =>
      Number(tank.currentLevel) <= Number(tank.minLevel),
  ).length

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Dispensers"
          value={`${activeDispensers} / ${dispensers.length}`}
          subtitle="dispensers running now"
          icon={Gauge}
          color="blue"
        />

        <StatCard
          title="Today's Revenue"
          value={`SAR ${todayRevenue.toFixed(2)}`}
          subtitle={`${todayTransactions} transactions`}
          icon={ShoppingCart}
          color="green"
        />

        <StatCard
          title="Fuel Alerts"
          value={lowTanks}
          subtitle={
            lowTanks > 0
              ? `${lowTanks} tank${lowTanks > 1 ? 's' : ''} below minimum`
              : 'all tanks healthy'
          }
          icon={Fuel}
          color={lowTanks > 0 ? 'red' : 'amber'}
        />

        <StatCard
          title="Active Staff"
          value={activeEmployees}
          subtitle="active employees on record"
          icon={Users}
          color="amber"
        />
      </div>

      {/* Dashboard content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Fuel tank levels */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Fuel Tank Levels
          </h2>

          {tanks.length === 0 ? (
            <p className="text-sm text-gray-500">
              No fuel tanks configured.
            </p>
          ) : (
            <div className="space-y-4">
              {tanks.map(tank => (
                <FuelLevelBar
                  key={tank.id}
                  fuelType={tank.fuelType}
                  currentLevel={Number(tank.currentLevel)}
                  capacity={Number(tank.capacity)}
                  minLevel={Number(tank.minLevel)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Dispenser status */}
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-base font-semibold text-gray-800">
            Dispenser Status
          </h2>

          {dispensers.length === 0 ? (
            <p className="text-sm text-gray-500">
              No dispensers configured.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dispensers.map(dispenser => {
                const statusColor =
                  statusStyles[dispenser.status] ??
                  statusStyles.IDLE

                const dispenserFuelTypes = [
                  ...new Set(
                    dispenser.nozzles.map(
                      nozzle =>
                        fuelShort[nozzle.fuelType] ??
                        nozzle.fuelType,
                    ),
                  ),
                ]

                return (
                  <div
                    key={dispenser.id}
                    className={`rounded-lg border p-3 text-center ${statusColor}`}
                  >
                    <p className="text-lg font-bold">
                      #{dispenser.dispenserNumber}
                    </p>

                    <p className="mt-0.5 text-xs font-medium">
                      {dispenserFuelTypes.length > 0
                        ? dispenserFuelTypes.join(' / ')
                        : 'No nozzles'}
                    </p>

                    <p className="mt-1 text-xs capitalize">
                      {dispenser.status
                        .toLowerCase()
                        .replaceAll('_', ' ')}
                    </p>

                    <p className="mt-1 text-xs opacity-75">
                      {dispenser.nozzles.length}{' '}
                      {dispenser.nozzles.length === 1
                        ? 'nozzle'
                        : 'nozzles'}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}