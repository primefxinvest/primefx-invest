'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { Bell, Gift, Menu, Search } from 'lucide-react'
import {
  DashboardCommandMenu,
  useDashboardCommandMenu,
} from '@/components/shared/DashboardCommandMenu'
import { NavbarLanguageMenu } from '@/components/shared/NavbarLanguageMenu'
import { useMobileNav } from '@/components/shared/MobileNavContext'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { fetchNotifications } from '@/lib/data/queries'
import { cn } from '@/lib/utils'

function usePlatformShortcut() {
  const [shortcut, setShortcut] = useState('Ctrl+K')

  useEffect(() => {
    setShortcut(/Mac|iPhone|iPad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl+K')
  }, [])

  return shortcut
}

function NavIconButton({
  href,
  label,
  children,
  badge,
}: {
  href: string
  label: string
  children: ReactNode
  badge?: number
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      ) : null}
    </Link>
  )
}

export default function Navbar() {
  const user = useSessionUser()
  const { open, setOpen } = useDashboardCommandMenu()
  const { toggle: toggleMobileNav } = useMobileNav()
  const shortcut = usePlatformShortcut()
  const { data: notifications = [] } = useAsyncData(() => fetchNotifications(), [])
  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-gray-200 bg-white/95 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md lg:left-64">
        <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={toggleMobileNav}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Search"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 lg:hidden"
          >
            <Search className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className={cn(
              'hidden h-10 min-w-0 flex-1 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 text-left transition-colors lg:flex',
              'hover:border-[#0052ff]/30 hover:bg-gray-100/90 lg:max-w-md xl:max-w-xl'
            )}
          >
            <Search className="size-4 shrink-0 text-gray-400" />
            <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
              Search plans, insights, reports...
            </span>
            <kbd className="hidden shrink-0 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-400 md:inline">
              {shortcut}
            </kbd>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5">
              <NavIconButton href="/rewards" label="Rewards">
                <Gift className="size-[18px]" />
              </NavIconButton>

              <NavIconButton href="/notifications" label="Notifications" badge={unreadCount}>
                <Bell className="size-[18px]" />
              </NavIconButton>

              <NavbarLanguageMenu />
            </div>

            <Link
              href="/profile"
              className="flex min-w-0 items-center gap-2 border-l border-gray-200 pl-2 sm:gap-2.5 sm:pl-3 md:pl-4"
              title={`${user.name} · ${user.tier}`}
            >
              <div className="hidden min-w-0 flex-1 text-right sm:block">
                <p className="truncate text-sm font-medium leading-tight text-gray-900">
                  {user.name}
                </p>
                <p className="truncate text-xs leading-tight text-gray-500">{user.tier}</p>
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                className="size-9 shrink-0 rounded-full border-2 border-gray-200 bg-gray-100 object-cover"
              />
            </Link>
          </div>
        </div>
      </header>

      <DashboardCommandMenu open={open} onOpenChange={setOpen} />
    </>
  )
}
