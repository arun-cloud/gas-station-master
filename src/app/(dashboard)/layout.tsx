import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { requireUser } from '@/lib/rbac'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Defense in depth: middleware.ts already blocks this route for
  // unauthenticated/inactive users. This also gives us the user's
  // name/role/branch context to render.
  const user = await requireUser()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar — fixed left column */}
      <Sidebar user={{ name: user.name, role: user.role }} />

      {/* Main area — takes remaining width */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}