'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Fuel,
  Gauge,
  ShoppingCart,
  Users,
  Truck,
  BarChart3,
  Settings,
  Zap,
  Plus,
  Clock,
  ShieldCheck,
  Building2,
  LogOut,
  Receipt,
} from 'lucide-react'

type Role = 'ADMIN' | 'MANAGER' | 'CASHIER'

type SidebarUser = {
  name: string
  role: Role
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Dispensers', href: '/dispensers', icon: Fuel },
  { label: 'Inventory', href: '/fuel', icon: Gauge },
  { label: 'New Sale', href: '/sales/new', icon: Plus },
  { label: 'Sales Log', href: '/sales', icon: ShoppingCart },
  { label: 'Invoices', href: '/invoices', icon: Receipt },
  { label: 'Employees', href: '/employees', icon: Users },
  { label: 'Shift History', href: '/employees/shifts', icon: Clock },
  { label: 'Suppliers', href: '/suppliers', icon: Truck },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
]

const roleLabels: Record<Role, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
}

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname()

  const items =
    user.role === 'ADMIN'
      ? [
          ...navItems,
          { label: 'User Approvals', href: '/admin/users', icon: ShieldCheck },
          { label: 'Branches', href: '/admin/branches', icon: Building2 },
        ]
      : user.role === 'MANAGER'
        ? [
            ...navItems,
            { label: 'User Approvals', href: '/admin/users', icon: ShieldCheck },
          ]
        : navItems

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col h-full shrink-0">

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-700">
        <div className="bg-amber-500 rounded-lg p-1.5">
          <Zap size={18} className="text-gray-900" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">FuelStation</p>
          <p className="text-xs text-gray-400 leading-tight">Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon

          const isActive =
            pathname === item.href || (item.href !== '/dashboard' && item.href !== '/sales' && pathname.startsWith(item.href)) || (item.href === '/sales' && pathname === '/sales')
            || (item.href === '/employees' && pathname === '/employees')


          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive
                ? 'bg-amber-500 text-gray-900 font-medium'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom user info */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 text-xs font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.name}
            </p>
            <p className="text-xs text-gray-400">{roleLabels[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}