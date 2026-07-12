import { prisma } from '@/lib/prisma'
import SalesTable from '@/components/sales/SalesTable'
import StatCard from '@/components/dashboard/StatCard'
import Link from 'next/link'
import { ShoppingCart, TrendingUp, Fuel, Plus } from 'lucide-react'

export default async function SalesPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [todaySales, allTimeSales] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: today } },
      include: {
        dispenser: { select: { dispenserNumber: true } },
        user: { select: { name: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true, litres: true },
      _count: { id: true },
    }),
  ])

  const todayRevenue = todaySales.reduce(
    (sum, s) => sum + Number(s.totalAmount), 0
  )
  const todayLitres = todaySales.reduce(
    (sum, s) => sum + Number(s.litres), 0
  )

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales</h1>
          <p className="text-sm text-gray-500 mt-0.5">Today's transactions</p>
        </div>
        <Link
          href="/sales/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600
            text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Sale
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`SAR ${todayRevenue.toFixed(2)}`}
          subtitle={`${todaySales.length} transactions`}
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          title="Litres Sold Today"
          value={`${todayLitres.toFixed(0)} L`}
          subtitle="across all pumps"
          icon={Fuel}
          color="blue"
        />
        <StatCard
          title="All-time Revenue"
          value={`SAR ${Number(allTimeSales._sum.totalAmount ?? 0).toFixed(2)}`}
          subtitle={`${allTimeSales._count.id} total sales`}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Today's sales table */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">
            Today's Sales
          </h2>
          <span className="text-xs text-gray-400">
            {new Date().toLocaleDateString('en-SA', {
              weekday: 'long', day: 'numeric',
              month: 'long', year: 'numeric'
            })}
          </span>
        </div>
        <SalesTable sales={todaySales as any} />
      </div>
    </div>
  )
}