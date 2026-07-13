import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/rbac'
import BranchForm from '@/components/branches/BranchForm'
import BranchStatusToggle from '@/components/branches/BranchStatusToggle'
import { Building2 } from 'lucide-react'

export default async function AdminBranchesPage() {
  // Page-level guard. Middleware already blocks /admin/:path* for
  // unauthenticated/inactive users; this enforces the ADMIN-only role rule
  // and redirects MANAGER/CASHIER away rather than showing an empty page.
  await requireRole(['ADMIN'])

  const branches = await prisma.branch.findMany({
    orderBy: { nameEn: 'asc' },
    include: {
      _count: {
        select: { dispensers: true, fuelTanks: true, userBranches: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Branches</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {branches.length} branch{branches.length === 1 ? '' : 'es'} configured
          </p>
        </div>
        <BranchForm mode="create" />
      </div>

      {branches.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Building2 size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No branches yet. Add your first branch above.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Branch</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Dispensers</th>
                <th className="px-4 py-3 font-medium">Tanks</th>
                <th className="px-4 py-3 font-medium">Users</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {branches.map(branch => (
                <tr key={branch.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{branch.nameEn}</p>
                    <p className="text-xs text-gray-400" dir="rtl">
                      {branch.nameAr}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{branch.branchCode}</td>
                  <td className="px-4 py-3 text-gray-600">{branch.city}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {branch._count.dispensers}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {branch._count.fuelTanks}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {branch._count.userBranches}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        branch.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {branch.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <BranchForm
                        mode="edit"
                        branch={{
                          id: branch.id,
                          nameEn: branch.nameEn,
                          nameAr: branch.nameAr,
                          branchCode: branch.branchCode,
                          buildingNo: branch.buildingNo,
                          street: branch.street,
                          district: branch.district,
                          city: branch.city,
                          postalCode: branch.postalCode,
                        }}
                      />
                      <BranchStatusToggle
                        branchId={branch.id}
                        isActive={branch.isActive}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
