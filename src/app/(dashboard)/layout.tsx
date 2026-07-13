import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { requireUser } from '@/lib/rbac'
import { resolveActiveBranch } from '@/lib/branch-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defense in depth: middleware.ts already blocks this route for
  // unauthenticated/inactive users. This also gives us the user's
  // name/role/branch context to render.
  const user = await requireUser()

  // Resolved fresh on every request from the session + cookie — see
  // branch-context.ts for why this is safe against a tampered cookie.
  const { branches, activeBranchId } = await resolveActiveBranch()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — fixed left column */}
      <Sidebar user={{ name: user.name, role: user.role }} />

      {/* Main area — takes remaining width */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar branches={branches} activeBranchId={activeBranchId} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}