import Link from 'next/link'
import type { SettingsCategory } from '@/lib/settings/navigation'

export default function SettingsCategoryCard({ category }: { category: SettingsCategory }) {
  const Icon = category.icon

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 p-2.5 text-amber-700">
            <Icon size={21} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{category.label}</h2>
            <p className="mt-1 text-sm text-gray-500">{category.description}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {category.modules.map((module) => {
          const ModuleIcon = module.icon
          return (
            <Link
              key={module.href}
              href={module.href}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50"
            >
              <ModuleIcon size={17} className="shrink-0 text-gray-400" />
              <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
                {module.label}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-500">
                {module.scope}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
