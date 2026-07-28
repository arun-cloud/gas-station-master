import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Clock3 } from 'lucide-react'
import { getSettingsModule } from '@/lib/settings/navigation'
import { requireUser } from '@/lib/rbac'

export default async function SettingsModulePlaceholder({
  params,
}: {
  params: Promise<{ category: string; module: string }>
}) {
  const { category, module: moduleSlug } = await params
  const settingsModule = getSettingsModule(category, moduleSlug)

  if (!settingsModule || settingsModule.href === '/settings/integrations/loyverse') {
    notFound()
  }

  const user = await requireUser()
  if (!settingsModule.allowedRoles.includes(user.role)) {
    redirect('/settings')
  }

  const Icon = settingsModule.icon

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/settings"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
            <Icon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{settingsModule.label}</h1>
            <p className="mt-1 text-sm text-gray-500">{settingsModule.description}</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <Clock3 size={34} className="mx-auto text-gray-300" />
        <h2 className="mt-3 font-semibold text-gray-800">
          {settingsModule.status === 'Phase 9' ? 'Planned for Phase 9' : 'Module coming soon'}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
          This stable route is ready for the {settingsModule.label} implementation. No configuration
          changes are available here yet.
        </p>
        <div className="mt-5 flex justify-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-600">
            {settingsModule.scope} scope
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800">
            {settingsModule.status}
          </span>
        </div>
      </section>
    </div>
  )
}
