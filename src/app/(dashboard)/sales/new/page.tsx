import { prisma } from '@/lib/prisma'
import POSTerminal from '@/components/sales/POSTerminal'

export default async function NewSalePage() {
  const [pumps, customers] = await Promise.all([
    prisma.dispenser.findMany({ orderBy: { dispenserNumber: 'asc' } }),
    prisma.customer.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Hardcoded admin user id for now — replaced when we add Auth
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  })

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
        userId={adminUser?.id ?? ''}
      />
    </div>
  )
}