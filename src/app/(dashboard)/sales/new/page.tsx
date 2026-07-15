import { prisma } from '@/lib/prisma'
import { requireUser } from '@/lib/rbac'
import { resolveActiveBranch } from '@/lib/branch-context'
import POSTerminal from '@/components/sales/POSTerminal'

export default async function NewSalePage() {
  await requireUser()

  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h1 className="font-semibold text-amber-900">
          No active branch
        </h1>
        <p className="mt-1 text-sm text-amber-700">
          Select or assign a branch before recording sales.
        </p>
      </div>
    )
  }
  const [dispensers, customers] = await Promise.all([
    prisma.dispenser.findMany({
      where: {
        branchId: activeBranch.id,
        isActive: true,
      },
      include: {
        nozzles: {
          where: {
            isActive: true,
          },
          orderBy: {
            nozzleNumber: 'asc',
          },
        },
      },
      orderBy: {
        dispenserNumber: 'asc',
      },
    }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Hardcoded admin user id for now — replaced when we add Auth
  // const adminUser = await prisma.user.findFirst({
  //   where: { role: 'ADMIN' }
  // })

  const pumps = dispensers.flatMap(dispenser =>
    dispenser.nozzles.map(nozzle => ({
      id: nozzle.id,
      pumpNumber: dispenser.dispenserNumber,
      nozzleNumber: nozzle.nozzleNumber,
      fuelType: nozzle.fuelType,
      status: dispenser.status,
    })),
  )

  const serializedPumps = JSON.parse(JSON.stringify(pumps));
  const serializedCustomers = JSON.parse(JSON.stringify(customers));


  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">New Sale</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Record a fuel transaction
        </p>
      </div>

      <POSTerminal
        pumps={serializedPumps}
        customers={serializedCustomers}

      />
    </div>
  )
}