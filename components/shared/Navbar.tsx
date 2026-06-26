'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Bell, Globe, Gift } from 'lucide-react'
import { useSessionUser } from '@/lib/hooks/useSessionUser'

interface NavbarProps {
  notificationCount?: number
}

export default function Navbar({ notificationCount = 3 }: NavbarProps) {
  const router = useRouter()
  const user = useSessionUser()

  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <div className="mx-auto flex max-w-8xl items-center justify-between gap-6">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Search for plans, insights, reports..."
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim()
                if (value) router.push(`/primeai?q=${encodeURIComponent(value)}`)
              }
            }}
          />
          <kbd className="hidden rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 sm:inline">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/rewards"
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Rewards"
          >
            <Gift className="h-5 w-5" />
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {notificationCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            className="hidden items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 sm:flex"
          >
            <Globe className="h-4 w-4" />
            <span>English</span>
          </button>

          <Link
            href="/profile"
            className="ml-2 flex items-center gap-3 border-l border-gray-200 pl-4"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.tier}</p>
            </div>
            <img
              src={user.avatar}
              alt={user.name}
              className="h-9 w-9 rounded-full border-2 border-gray-200 bg-gray-100"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
