import { prisma } from '@/lib/prisma'
import PumpCard from '@/components/dispensers/PumpCard'
import AddPumpForm from '@/components/dispensers/AddPumpForm'
import { Gauge } from 'lucide-react'

export default async function PumpsPage() {
  // Temporary single-branch implementation.
  // Later this should come from the authenticated user's branchId.
  const branch = await prisma.branch.findFirst({
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      nameEn: true,
    },
  })

  if (!branch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="text-lg font-semibold text-amber-900">
          Branch required
        </h1>

        <p className="mt-1 text-sm text-amber-700">
          Create a Fuel Arkan branch before adding
          dispensers.
        </p>
      </div>
    )
  }

  const dispensers =
    await prisma.dispenser.findMany({
      where: {
        branchId: branch.id,
      },

      include: {
        nozzles: {
          orderBy: {
            nozzleNumber: 'asc',
          },
        },
      },

      orderBy: {
        dispenserNumber: 'asc',
      },
    })

  const counts = {
    ACTIVE: dispensers.filter(
      dispenser =>
        dispenser.status === 'ACTIVE',
    ).length,

    IDLE: dispensers.filter(
      dispenser => dispenser.status === 'IDLE',
    ).length,

    MAINTENANCE: dispensers.filter(
      dispenser =>
        dispenser.status === 'MAINTENANCE',
    ).length,

    OFFLINE: dispensers.filter(
      dispenser =>
        dispenser.status === 'OFFLINE',
    ).length,
  }

  const summaries = [
    {
      label: 'Active',
      count: counts.ACTIVE,
      color:
        'bg-green-100 text-green-700',
    },
    {
      label: 'Idle',
      count: counts.IDLE,
      color: 'bg-gray-100 text-gray-600',
    },
    {
      label: 'Maintenance',
      count: counts.MAINTENANCE,
      color:
        'bg-amber-100 text-amber-700',
    },
    {
      label: 'Offline',
      count: counts.OFFLINE,
      color: 'bg-red-100 text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dispensers Management
          </h1>

          <p className="mt-0.5 text-sm text-gray-500">
            {dispensers.length} dispensers total
            {' · '}
            {branch.nameEn}
          </p>
        </div>

        <AddPumpForm branchId={branch.id} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {summaries.map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <span className="text-sm text-gray-500">
              {item.label}
            </span>

            <span
              className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${item.color}`}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>

      {dispensers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Gauge
            size={40}
            className="mx-auto mb-3 opacity-30"
          />

          <p className="text-sm">
            No dispensers yet. Add your first
            dispenser above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {dispensers.map(dispenser => (
            <PumpCard
              key={dispenser.id}
              pump={dispenser}
            />
          ))}
        </div>
      )}
    </div>
  )
}