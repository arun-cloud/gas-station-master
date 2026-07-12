'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'

// Map routes to readable page titles
const pageTitles: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/pumps':      'Pump Management',
  '/fuel':       'Fuel Inventory',
  '/sales':      'Sales',
  '/employees':  'Employees',
  '/suppliers':  'Suppliers',
  '/reports':    'Reports',
  '/settings':   'Settings',
}

export default function Topbar() {
  const pathname  = usePathname()
  const pageTitle = pageTitles[pathname] ?? 'Gas Station MS'

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">

      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-800">
        {pageTitle}
      </h1>

      {/* Right side controls */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 text-sm bg-gray-100 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-amber-500 w-48"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          {/* Red dot for unread */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-gray-900 text-xs font-bold cursor-pointer">
          A
        </div>
      </div>
    </header>
  )
}