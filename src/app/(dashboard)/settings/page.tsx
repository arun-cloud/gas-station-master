import SettingsCategoryCard from '@/components/settings/SettingsCategoryCard'
import { getSettingsCategoriesForRole } from '@/lib/settings/navigation'
import { requireUser } from '@/lib/rbac'

export default async function SettingsPage() {
  const user = await requireUser()
  const categories = getSettingsCategoriesForRole(user.role)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure integrations, business rules, security, and system behavior.
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {categories.map((category) => (
          <SettingsCategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </div>
  )
}
