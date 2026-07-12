import { prisma }            from '@/lib/prisma'
import ShiftHistoryTable     from '@/components/employees/ShiftHistoryTable'
import Link                  from 'next/link'
import { ArrowLeft }         from 'lucide-react'

export default async function ShiftsPage() {
  const shifts = await prisma.shift.findMany({
    orderBy: { startTime: 'desc' },
    take:    50,
    include: {
      user: { select: { name: true, role: true } },
    },
  })

  const activeShifts = shifts.filter(s => s.status === 'ACTIVE')

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/employees"
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Shift History</h1>
            <p className="text-sm text-gray-500 mt-0.5">Last 50 shifts</p>
          </div>
        </div>

        {activeShifts.length > 0 && (
          <div className="flex items-center gap-2 bg-green-100 text-green-700
            px-3 py-1.5 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {activeShifts.length} active shift{activeShifts.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ShiftHistoryTable shifts={shifts as any} />
      </div>
    </div>
  )
}