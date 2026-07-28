'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Settings } from 'lucide-react'
import {
  getSettingsCategoriesForRole,
  type SettingsRole,
} from '@/lib/settings/navigation'

export default function SettingsNavigation({ role }: { role: SettingsRole }) {
  const pathname = usePathname()
  const categories = getSettingsCategoriesForRole(role)

  return (
    <>
      <div className="lg:hidden">
        <details className="group rounded-xl border border-gray-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800">
            <span className="flex items-center gap-2">
              <Settings size={17} />
              Settings menu
            </span>
            <ChevronDown size={17} className="transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-gray-100 p-3">
            <NavigationLinks pathname={pathname} categories={categories} />
          </div>
        </details>
      </div>

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <Link
            href="/settings"
            className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold ${
              pathname === '/settings'
                ? 'bg-amber-100 text-amber-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings size={17} />
            Settings overview
          </Link>
          <NavigationLinks pathname={pathname} categories={categories} />
        </div>
      </aside>
    </>
  )
}

type VisibleCategories = ReturnType<typeof getSettingsCategoriesForRole>

function NavigationLinks({
  pathname,
  categories,
}: {
  pathname: string
  categories: VisibleCategories
}) {
  return (
    <nav className="space-y-4">
      {categories.map((category) => (
        <div key={category.slug}>
          <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {category.label}
          </p>
          <div className="space-y-0.5">
            {category.modules.map((module) => {
              const active = pathname === module.href
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-amber-100 font-medium text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {module.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
