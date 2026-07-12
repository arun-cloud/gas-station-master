import { prisma }          from '@/lib/prisma'
import TankCard            from '@/components/fuel/TankCard'
import AddDeliveryForm     from '@/components/fuel/AddDeliveryForm'
import DeliveryHistory     from '@/components/fuel/DeliveryHistory'
import { Fuel, AlertTriangle } from 'lucide-react'

export default async function FuelInventoryPage() {
  const [tanks, suppliers, recentDeliveries] = await Promise.all([
    prisma.fuelTank.findMany({
      orderBy: { tankNumber: 'asc' }
    }),
    prisma.supplier.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' }
    }),
    prisma.fuelDelivery.findMany({
      orderBy: { deliveredAt: 'desc' },
      take:    20,
      include: {
        tank:     { select: { tankNumber: true, fuelType: true } },
        supplier: { select: { name: true } },
      },
    }),
  ])

  const criticalTanks = tanks.filter(
    t => Number(t.currentLevel) <= Number(t.minLevel)
  )
  const lowTanks = tanks.filter(
    t => Number(t.currentLevel) <= Number(t.minLevel) * 1.5
      && Number(t.currentLevel) > Number(t.minLevel)
  )

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fuel Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {tanks.length} tanks monitored
          </p>
        </div>
        <AddDeliveryForm tanks={tanks as any} suppliers={suppliers} />
      </div>

      {/* Critical alerts banner */}
      {criticalTanks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4
          flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {criticalTanks.length} tank{criticalTanks.length > 1 ? 's' : ''} at critical level
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              {criticalTanks.map(t => `Tank #${t.tankNumber}`).join(', ')} —
              immediate delivery required.
            </p>
          </div>
        </div>
      )}

      {/* Low level warning */}
      {lowTanks.length > 0 && criticalTanks.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4
          flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {lowTanks.length} tank{lowTanks.length > 1 ? 's' : ''} running low
            </p>
            <p className="text-sm text-amber-600 mt-0.5">
              {lowTanks.map(t => `Tank #${t.tankNumber}`).join(', ')} —
              schedule a delivery soon.
            </p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tanks.map(tank => {
          const pct = Math.round(
            (Number(tank.currentLevel) / Number(tank.capacity)) * 100
          )
          const isCritical = Number(tank.currentLevel) <= Number(tank.minLevel)
          const isLow = Number(tank.currentLevel) <= Number(tank.minLevel) * 1.5

          return (
            <div key={tank.id}
              className="bg-white rounded-xl border border-gray-200 px-4 py-3">
              <p className="text-xs text-gray-400">Tank #{tank.tankNumber}</p>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isCritical ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className={`text-sm font-semibold mt-1 ${
                isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'
              }`}>
                {pct}%
              </p>
            </div>
          )
        })}
      </div>

      {/* Tank cards grid */}
      {tanks.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Fuel size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No tanks configured yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
          {tanks.map(tank => (
            <TankCard key={tank.id} tank={tank as any} />
          ))}
        </div>
      )}

      {/* Delivery history */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            Recent Deliveries
          </h2>
          <span className="text-xs text-gray-400">
            Last {recentDeliveries.length} records
          </span>
        </div>
        <DeliveryHistory deliveries={recentDeliveries as any} />
      </div>

    </div>
  )
}