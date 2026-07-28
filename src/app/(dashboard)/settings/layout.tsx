import { redirect } from 'next/navigation'
import SettingsNavigation from '@/components/settings/SettingsNavigation'
import { requireUser } from '@/lib/rbac'

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  if (user.role === 'CASHIER') {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <SettingsNavigation role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
