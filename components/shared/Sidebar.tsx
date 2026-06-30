'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { logout } from '@/lib/auth/logout'
import Logo from '@/components/shared/Logo'
import SidebarUpgradeCard from '@/components/shared/SidebarUpgradeCard'
import { useMobileNav } from '@/components/shared/MobileNavContext'
import { toast } from 'sonner'
import {
  Home,
  TrendingUp,
  PieChart,
  Wallet,
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
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import { canAccessRoute } from '@/lib/investor/tiers'
import { INVESTOR_NAV_ITEMS } from '@/lib/investor/navigation'
import {
  isWalletNavActive,
  isWalletSectionActive,
  WALLET_NAV_ITEMS,
} from '@/lib/wallet/navigation'
import { useReferralProgramEnabled } from '@/lib/hooks/useReferralProgramEnabled'
import { fetchNotifications } from '@/lib/data/queries'
import { SIDEBAR_WIDTH_DESKTOP_CLASS, SIDEBAR_WIDTH_MOBILE_CLASS } from '@/lib/layout/sidebar'

const navIconMap = {
  '/dashboard': Home,
  '/invest': TrendingUp,
  '/portfolio': PieChart,
  '/wallet': Wallet,
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
  { href: '/notifications', labelKey: 'notifications', icon: Bell },
  { href: '/profile', labelKey: 'profile', icon: User },
  { href: '/settings', labelKey: 'settings', icon: Settings },
  { href: '/about', labelKey: 'about', icon: HelpCircle },
  { href: '/legal', labelKey: 'legal', icon: Scale },
] as const

const SIDEBAR_LABEL_KEYS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/invest': 'invest',
  '/portfolio': 'portfolio',
  '/wallet': 'wallet',
  '/primeai': 'primeai',
  '/academy': 'academy',
  '/reports': 'reports',
  '/rewards': 'rewards',
  '/community': 'community',
  '/referral': 'referral',
  '/market-insights': 'marketInsights',
  '/support': 'support',
  '/wallet/transfer': 'transfer',
}

const WALLET_SUB_LABEL_KEYS: Record<string, string> = {
  '/wallet': 'overview',
  '/wallet/deposit': 'deposit',
  '/wallet/withdraw': 'withdraw',
  '/wallet/transfer': 'transfer',
  '/transactions': 'transactions',
}

export default function Sidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const { open, close } = useMobileNav()
  const [loggingOut, setLoggingOut] = useState(false)
  const [walletOpen, setWalletOpen] = useState(() => isWalletSectionActive(pathname))
  const { tierKey } = useInvestorTier()
  const { canAccess, loading: referralProgramLoading } = useReferralProgramEnabled()
  const { data: notifications = [] } = useAsyncData(() => fetchNotifications(), [])
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (isWalletSectionActive(pathname)) {
      setWalletOpen(true)
    }
  }, [pathname])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    const result = await logout()
    if (!result.success) {
      setLoggingOut(false)
      toast.error(t('logoutFailed'), { description: result.error })
    }
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label={t('closeMenu')}
          className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-[1px] lg:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-gray-200 bg-white pt-[env(safe-area-inset-top,0px)] shadow-xl transition-transform duration-300 ease-out lg:shadow-none',
          SIDEBAR_WIDTH_MOBILE_CLASS,
          SIDEBAR_WIDTH_DESKTOP_CLASS,
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3 py-3">
          <Logo href="/dashboard" size={34} className="gap-2" />
          <button
            type="button"
            onClick={close}
            aria-label={t('closeNavMenu')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      <nav className="primefx-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {INVESTOR_NAV_ITEMS.map((item) => {
            const Icon = navIconMap[item.href as keyof typeof navIconMap] ?? Home
            const tierLocked = item.requiredTier ? !canAccessRoute(tierKey, item.href) : false
            const referralLocked =
              item.href === '/referral' && !referralProgramLoading && !canAccess

            if (tierLocked) {
              return (
                <div
                  key={item.href}
                  title={`Requires ${item.requiredTier} tier`}
                  className="flex cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-400"
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="flex-1">{t(SIDEBAR_LABEL_KEYS[item.href] as 'dashboard')}</span>
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                </div>
              )
            }

            if (referralLocked) {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    title="Referral program is locked by admin"
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-violet-50 text-violet-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{t(SIDEBAR_LABEL_KEYS[item.href] as 'dashboard')}</span>
                    <Lock className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  </div>
                </Link>
              )
            }

            if (item.href === '/wallet') {
              const walletActive = isWalletSectionActive(pathname)

              return (
                <div key={item.href} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setWalletOpen((current) => !current)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                      walletActive
                        ? 'bg-[#0052ff] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Wallet className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">{t('wallet')}</span>
                    {walletOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-80" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-80" />
                    )}
                  </button>

                  {walletOpen ? (
                    <div className="ml-3 space-y-0.5 border-l border-gray-200 pl-1.5">
                      {WALLET_NAV_ITEMS.map((subItem) => {
                        const subActive = isWalletNavActive(pathname, subItem.href)
                        return (
                          <Link key={subItem.href} href={subItem.href}>
                            <div
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                                subActive
                                  ? 'bg-blue-50 text-[#0052ff]'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                              )}
                            >
                              {subActive ? (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0052ff]" />
                              ) : (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-transparent" />
                              )}
                              {t(WALLET_SUB_LABEL_KEYS[subItem.href] as 'overview')}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            }

            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[#0052ff] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t(SIDEBAR_LABEL_KEYS[item.href] as 'dashboard')}</span>
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
                    'flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'bg-[#0052ff] text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{t(item.labelKey)}</span>
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

      <div className="shrink-0 border-t border-gray-200 px-2 py-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          <span>{loggingOut ? t('loggingOut') : t('logout')}</span>
        </button>
      </div>
    </aside>
    </>
  )
}
