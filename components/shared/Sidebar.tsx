'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth/logout'
import Logo from '@/components/shared/Logo'
import SidebarUpgradeCard from '@/components/shared/SidebarUpgradeCard'
import { toast } from 'sonner'
import {
  Home,
  TrendingUp,
  PieChart,
  Wallet,
  History,
  Zap,
  BookOpen,
  FileText,
  Trophy,
  Users,
  Share2,
  BarChart3,
  MessageSquare,
  Bell,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Scale,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessRoute } from '@/lib/investor/tiers'
import { INVESTOR_NAV_ITEMS } from '@/lib/investor/navigation'
import { fetchNotifications } from '@/lib/data/queries'

const navIconMap = {
  '/dashboard': Home,
  '/invest': TrendingUp,
  '/portfolio': PieChart,
  '/wallet': Wallet,
  '/transactions': History,
  '/primeai': Zap,
  '/academy': BookOpen,
  '/reports': FileText,
  '/rewards': Trophy,
  '/community': Users,
  '/referral': Share2,
  '/market-insights': BarChart3,
  '/support': MessageSquare,
} as const

const bottomNavItems = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: HelpCircle },
  { href: '/legal', label: 'Legal', icon: Scale },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)
  const { tierKey } = useInvestorTier()
  const { data: notifications = [] } = useAsyncData(() => fetchNotifications(), [])
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const result = await logout()
    if (!result.success) {
      setLoggingOut(false)
      toast.error('Logout failed', { description: result.error })
    }
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-200 px-5 py-5">
        <Logo href="/dashboard" size={40} />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {INVESTOR_NAV_ITEMS.map((item) => {
            const Icon = navIconMap[item.href as keyof typeof navIconMap] ?? Home
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const locked = item.requiredTier ? !canAccessRoute(tierKey, item.href) : false

            if (locked) {
              return (
                <div
                  key={item.href}
                  title={`Requires ${item.requiredTier} tier`}
                  className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400"
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-50" />
                  <span className="flex-1">{item.label}</span>
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                </div>
              )
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-3 space-y-0.5 border-t border-gray-200 pt-3">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#0052ff] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.href === '/notifications' && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </nav>

      <SidebarUpgradeCard />

      <div className="shrink-0 border-t border-gray-200 px-3 py-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
        >
          <LogOut className="h-5 w-5" />
          <span>{loggingOut ? 'Logging out...' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  )
}
