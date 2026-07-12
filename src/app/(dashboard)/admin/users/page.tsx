import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { ShieldAlert, UserCog } from 'lucide-react'
import PendingUserRow from '@/components/admin/PendingUserRow'

export default async function AdminUsersPage() {
  const user = await getCurrentUser()

  // Defense in depth: middleware already guarantees a logged-in, active
  // user reached this route. This is the permission (role) check.
  if (!user) {
    return null
  }

  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <ShieldAlert className="mx-auto mb-3 text-red-500" size={32} />
        <h1 className="text-lg font-semibold text-red-900">
          Access denied
        </h1>
        <p className="mt-1 text-sm text-red-700">
          Only administrators and managers can manage user accounts.
        </p>
      </div>
    )
  }

  const [pendingUsers, branches] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.branch.findMany({
      select: { id: true, nameEn: true },
      orderBy: { nameEn: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Pending User Activations
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {pendingUsers.length} account
          {pendingUsers.length === 1 ? '' : 's'} awaiting approval
        </p>
      </div>

      {branches.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm text-amber-700">
            Create a branch before activating users — every active user
            needs at least one branch assignment.
          </p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <UserCog size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">
            No pending accounts. New self-registrations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingUsers.map((pendingUser) => (
            <PendingUserRow
              key={pendingUser.id}
              user={pendingUser}
              branches={branches}
            />
          ))}
        </div>
      )}
    </div>
  )
}
