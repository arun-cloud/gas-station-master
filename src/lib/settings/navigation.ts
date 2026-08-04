import type { LucideIcon } from 'lucide-react'
import {
  Banknote,
  Bell,
  Boxes,
  Building2,
  Calculator,
  DatabaseBackup,
  FileClock,
  FileKey2,
  FileText,
  Fuel,
  Landmark,
  Link2,
  ListRestart,
  PackageSearch,
  ReceiptText,
  ScrollText,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UsersRound,
  Warehouse,
} from 'lucide-react'

export type SettingsRole = 'ADMIN' | 'MANAGER' | 'CASHIER'
export type SettingsScope = 'Company' | 'Branch'
export type SettingsStatus = 'Available' | 'Coming soon' | 'Phase 9'

export type SettingsModule = {
  slug: string
  label: string
  description: string
  href: string
  icon: LucideIcon
  scope: SettingsScope
  status: SettingsStatus
  allowedRoles: readonly SettingsRole[]
}

export type SettingsCategory = {
  slug: string
  label: string
  description: string
  icon: LucideIcon
  modules: readonly SettingsModule[]
}

const admins = ['ADMIN'] as const
const administratorsAndManagers = ['ADMIN', 'MANAGER'] as const

export const settingsCategories: readonly SettingsCategory[] = [
  {
    slug: 'integrations',
    label: 'Integrations',
    description: 'Connect the services that exchange data with your business.',
    icon: Link2,
    modules: [
      {
        slug: 'loyverse',
        label: 'Loyverse POS',
        description: 'Connect a Loyverse store and import branch sales data.',
        href: '/settings/integrations/loyverse',
        icon: Link2,
        scope: 'Branch',
        status: 'Available',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'zatca',
        label: 'ZATCA E-Invoicing',
        description: 'Configure the future ZATCA e-invoicing connection.',
        href: '/settings/integrations/zatca',
        icon: ReceiptText,
        scope: 'Company',
        status: 'Phase 9',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
  {
    slug: 'master-data',
    label: 'Master Data',
    description: 'Maintain shared records used throughout daily operations.',
    icon: DatabaseBackup,
    modules: [
      {
        slug: 'reference-data',
        label: 'Reference Data',
        description: 'Manage reusable codes, classifications, and lookup values.',
        href: '/settings/master-data/reference-data',
        icon: Tags,
        scope: 'Company',
        status: 'Available',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'products-services',
        label: 'Product & Service Master',
        description: 'Maintain the catalog of products, fuel, and services.',
        href: '/settings/master-data/products-services',
        icon: PackageSearch,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'cash-bank-accounts',
        label: 'Cash & Bank Accounts',
        description: 'Define cash drawers, bank accounts, and settlement accounts.',
        href: '/settings/master-data/cash-bank-accounts',
        icon: Landmark,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
  {
    slug: 'finance',
    label: 'Finance',
    description: 'Control tax, numbering, and fiscal behavior.',
    icon: Banknote,
    modules: [
      {
        slug: 'tax-configuration',
        label: 'Tax Configuration',
        description: 'Configure VAT rates, tax registration, and calculation rules.',
        href: '/settings/finance/tax-configuration',
        icon: Calculator,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'invoice-numbering',
        label: 'Invoice Numbering',
        description: 'Set prefixes and numbering sequences for documents.',
        href: '/settings/finance/invoice-numbering',
        icon: FileText,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'fiscal-settings',
        label: 'Fiscal Settings',
        description: 'Define financial periods and fiscal controls.',
        href: '/settings/finance/fiscal-settings',
        icon: FileClock,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
  {
    slug: 'inventory',
    label: 'Inventory',
    description: 'Set the rules used to control stock and fuel.',
    icon: Warehouse,
    modules: [
      {
        slug: 'stock-settings',
        label: 'Stock Settings',
        description: 'Configure stock valuation and inventory behavior.',
        href: '/settings/inventory/stock-settings',
        icon: Boxes,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'fuel-settings',
        label: 'Fuel Settings',
        description: 'Configure fuel-specific units, tolerances, and controls.',
        href: '/settings/inventory/fuel-settings',
        icon: Fuel,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'reorder-rules',
        label: 'Reorder Rules',
        description: 'Define replenishment thresholds and reorder behavior.',
        href: '/settings/inventory/reorder-rules',
        icon: ListRestart,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
  {
    slug: 'security',
    label: 'Security',
    description: 'Control access and review important activity.',
    icon: ShieldCheck,
    modules: [
      {
        slug: 'user-roles',
        label: 'User Roles',
        description: 'Review the fixed administrator, manager, and cashier roles.',
        href: '/settings/security/user-roles',
        icon: UsersRound,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: admins,
      },
      {
        slug: 'permissions',
        label: 'Permissions',
        description: 'Review and manage role permissions.',
        href: '/settings/security/permissions',
        icon: FileKey2,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: admins,
      },
      {
        slug: 'audit-logs',
        label: 'Audit Logs',
        description: 'Review security and operational activity.',
        href: '/settings/security/audit-logs',
        icon: ScrollText,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
  {
    slug: 'system',
    label: 'System',
    description: 'Manage company, branch, notification, and maintenance settings.',
    icon: Settings2,
    modules: [
      {
        slug: 'company-information',
        label: 'Company Information',
        description: 'Maintain legal and contact information for the company.',
        href: '/settings/system/company-information',
        icon: Building2,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'branch-configuration',
        label: 'Branch Configuration',
        description: 'Configure branch identity and operational defaults.',
        href: '/settings/system/branch-configuration',
        icon: SlidersHorizontal,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'notifications',
        label: 'Notifications',
        description: 'Choose which events produce system notifications.',
        href: '/settings/system/notifications',
        icon: Bell,
        scope: 'Branch',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
      {
        slug: 'backup-maintenance',
        label: 'Backup & Maintenance',
        description: 'Review backup and system maintenance controls.',
        href: '/settings/system/backup-maintenance',
        icon: DatabaseBackup,
        scope: 'Company',
        status: 'Coming soon',
        allowedRoles: administratorsAndManagers,
      },
    ],
  },
] as const

export function getSettingsModule(categorySlug: string, moduleSlug: string) {
  return settingsCategories
    .find((category) => category.slug === categorySlug)
    ?.modules.find((module) => module.slug === moduleSlug)
}

export function getSettingsCategoriesForRole(role: SettingsRole) {
  return settingsCategories
    .map((category) => ({
      ...category,
      modules: category.modules.filter((module) => module.allowedRoles.includes(role)),
    }))
    .filter((category) => category.modules.length > 0)
}
