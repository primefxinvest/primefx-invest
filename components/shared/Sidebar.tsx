'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { m, AnimatePresence } from 'framer-motion'
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
  Trophy,
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
import {
  isReferralRoute,
  isReferralSectionActive,
  parseReferralSection,
  REFERRAL_SECTIONS,
} from '@/lib/referral/navigation'
import { fetchNotifications } from '@/lib/data/queries'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import { SIDEBAR_WIDTH_DESKTOP_CLASS, SIDEBAR_WIDTH_MOBILE_CLASS, SIDEBAR_WIDTH_TABLET_CLASS } from '@/lib/layout/sidebar'
import { MOTION_VARIANTS } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import {
  NAV_ICON_SLOT,
  NAV_ITEM_ACTIVE,
  NAV_ITEM_BASE,
  NAV_ITEM_INACTIVE,
  NAV_LABEL_CLASS,
  NAV_SECTION_DIVIDER,
  NAV_SUB_ITEM_ACTIVE,
  NAV_SUB_ITEM_BASE,
  NAV_SUB_ITEM_INACTIVE,
  NAV_WALLET_SUBMENU_CLASS,
} from '@/lib/layout/nav-styles'

const REFERRAL_SUB_ITEM_ACTIVE =
  'bg-orange-50 text-orange-600 font-semibold border-l-2 border-orange-500'
const REFERRAL_SUB_ITEM_INACTIVE = 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'

const navIconMap = {
  '/dashboard': Home,
  '/invest': TrendingUp,
  '/portfolio': PieChart,
  '/wallet': Wallet,
  '/primeai': Zap,
  '/academy': BookOpen,
  '/rewards': Trophy,
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
  '/rewards': 'rewards',
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

function navItemClass(active: boolean, extra?: string) {
  return cn(
    NAV_ITEM_BASE,
    'md:justify-center md:gap-0 md:px-2 lg:justify-start lg:gap-2.5 lg:px-3',
    active ? NAV_ITEM_ACTIVE : NAV_ITEM_INACTIVE,
    extra
  )
}

function subNavItemClass(active: boolean) {
  return cn(NAV_SUB_ITEM_BASE, active ? NAV_SUB_ITEM_ACTIVE : NAV_SUB_ITEM_INACTIVE)
}

function referralSubNavItemClass(active: boolean) {
  return cn(NAV_SUB_ITEM_BASE, active ? REFERRAL_SUB_ITEM_ACTIVE : REFERRAL_SUB_ITEM_INACTIVE)
}

export default function Sidebar() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const referralSection = parseReferralSection(searchParams.get('section'))
  const { open, close } = useMobileNav()
  const reducedMotion = useReducedMotion()
  const asideRef = useRef<HTMLElement>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [walletOpen, setWalletOpen] = useState(() => isWalletSectionActive(pathname))
  const [referralOpen, setReferralOpen] = useState(() => isReferralRoute(pathname))
  const { tierKey } = useInvestorTier()
  const { data: notifications = [] } = useAsyncData(() => fetchNotifications(), [], undefined, {
    cacheKey: CACHE_KEYS.userNotifications,
  })
  const unreadCount = (notifications ?? []).filter((n) => !n.read).length

  useEffect(() => {
    close()
  }, [pathname, close])

  useEffect(() => {
    if (isWalletSectionActive(pathname)) {
      setWalletOpen(true)
    }
  }, [pathname])

  useEffect(() => {
    if (isReferralRoute(pathname)) {
      setReferralOpen(true)
    }
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, close])

  useEffect(() => {
    if (!open || !asideRef.current) return

    const focusable = asideRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first.focus()

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', trapFocus)
    return () => document.removeEventListener('keydown', trapFocus)
  }, [open])

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
      <AnimatePresence>
        {open ? (
          <m.button
            type="button"
            key="sidebar-backdrop"
            aria-label={t('closeMenu')}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            exit="exit"
            variants={MOTION_VARIANTS.backdrop}
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-[2px] lg:hidden"
            onClick={close}
          />
        ) : null}
      </AnimatePresence>

      <aside
        ref={asideRef}
        aria-label="Main navigation"
        aria-modal={open ? true : undefined}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-[100dvh] flex-col border-r border-gray-200 bg-white pt-[env(safe-area-inset-top,0px)] shadow-2xl transition-[transform,width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] lg:shadow-none',
          SIDEBAR_WIDTH_MOBILE_CLASS,
          SIDEBAR_WIDTH_TABLET_CLASS,
          SIDEBAR_WIDTH_DESKTOP_CLASS,
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile drawer header — logo + close on one centered row */}
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-5 md:hidden">
          <Logo
            href="/dashboard"
            size={34}
            showText
            priority
            className={cn(
              'min-w-0 items-center gap-2.5',
              '[&_img]:block [&_img]:self-center',
              '[&>div.flex-col]:justify-center [&>div.flex-col]:gap-px',
              '[&>div.flex-col>span:first-child]:text-[15px]',
              '[&>div.flex-col>span:first-child]:font-extrabold',
              '[&>div.flex-col>span:first-child]:leading-none',
              '[&>div.flex-col>span:last-child]:text-[9px]',
              '[&>div.flex-col>span:last-child]:font-bold',
              '[&>div.flex-col>span:last-child]:leading-none',
              '[&>div.flex-col>span:last-child]:tracking-[0.2em]'
            )}
          />
          <button
            type="button"
            onClick={close}
            aria-label={t('closeNavMenu')}
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 active:bg-gray-100"
          >
            <X className="size-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        {/* Brand lockup — tablet + desktop */}
        <div className="relative hidden h-[72px] shrink-0 items-center border-b border-gray-200 md:flex lg:h-20">
          <div className="hidden w-full items-center justify-center md:flex lg:hidden">
            <Logo
              href="/dashboard"
              size={36}
              showText={false}
              className="shrink-0"
              priority
            />
          </div>

          {/* Desktop: left-aligned lockup with equal horizontal padding */}
          <div className="hidden w-full items-center px-6 lg:flex">
            <Logo
              href="/dashboard"
              size={36}
              showText
              className="min-w-0 shrink-0 gap-3"
              priority
            />
          </div>
        </div>

        <nav className="primefx-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="Dashboard pages">
          <div className="space-y-1.5">
            {INVESTOR_NAV_ITEMS.map((item) => {
              const Icon = navIconMap[item.href as keyof typeof navIconMap] ?? Home
              const tierLocked = item.requiredTier ? !canAccessRoute(tierKey, item.href) : false

              if (tierLocked) {
                return (
                  <div
                    key={item.href}
                    title={`Requires ${item.requiredTier} tier`}
                    aria-disabled="true"
                    className={cn(NAV_ITEM_BASE, 'cursor-not-allowed text-gray-400')}
                  >
                    <span className={cn(NAV_ICON_SLOT, 'opacity-50')}>
                      <Icon />
                    </span>
                    <span className={NAV_LABEL_CLASS}>
                      {t(SIDEBAR_LABEL_KEYS[item.href] as 'dashboard')}
                    </span>
                    <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </div>
                )
              }

              if (item.href === '/wallet') {
                const walletActive = isWalletSectionActive(pathname)

                return (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href="/wallet"
                      title={t('wallet')}
                      aria-current={walletActive ? 'page' : undefined}
                      className={cn(navItemClass(walletActive), 'hidden md:flex lg:hidden')}
                    >
                      <span className={NAV_ICON_SLOT}>
                        <Wallet />
                      </span>
                      <span className="sr-only">{t('wallet')}</span>
                    </Link>

                    <button
                      type="button"
                      id="sidebar-wallet-toggle"
                      aria-expanded={walletOpen}
                      aria-controls="sidebar-wallet-submenu"
                      onClick={() => setWalletOpen((current) => !current)}
                      className={cn(navItemClass(walletActive), 'max-md:flex md:hidden lg:flex')}
                    >
                      <span className={NAV_ICON_SLOT}>
                        <Wallet />
                      </span>
                      <span className={cn(NAV_LABEL_CLASS, 'text-left')}>{t('wallet')}</span>
                      {walletOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      )}
                    </button>

                    {walletOpen ? (
                      <div
                        id="sidebar-wallet-submenu"
                        role="group"
                        aria-labelledby="sidebar-wallet-toggle"
                        className={NAV_WALLET_SUBMENU_CLASS}
                      >
                        {WALLET_NAV_ITEMS.map((subItem) => {
                          const subActive = isWalletNavActive(pathname, subItem.href)
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              aria-current={subActive ? 'page' : undefined}
                              className={subNavItemClass(subActive)}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  subActive ? 'bg-primary' : 'bg-transparent'
                                )}
                                aria-hidden
                              />
                              <span className={NAV_LABEL_CLASS}>
                                {t(WALLET_SUB_LABEL_KEYS[subItem.href] as 'overview')}
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    ) : null}
                  </div>
                )
              }

              if (item.href === '/referral') {
                const referralActive = isReferralRoute(pathname)

                return (
                  <div key={item.href} className="space-y-1">
                    <Link
                      href="/referral"
                      title={t('referralEarn')}
                      aria-current={referralActive ? 'page' : undefined}
                      className={cn(navItemClass(referralActive), 'hidden md:flex lg:hidden')}
                    >
                      <span className={NAV_ICON_SLOT}>
                        <Share2 />
                      </span>
                      <span className="sr-only">{t('referralEarn')}</span>
                    </Link>

                    <button
                      type="button"
                      id="sidebar-referral-toggle"
                      aria-expanded={referralOpen}
                      aria-controls="sidebar-referral-submenu"
                      onClick={() => setReferralOpen((current) => !current)}
                      className={cn(
                        navItemClass(referralActive),
                        'max-md:flex md:hidden lg:flex',
                        referralActive && !referralOpen ? 'bg-orange-50 text-orange-700 shadow-none hover:bg-orange-100' : undefined
                      )}
                    >
                      <span className={NAV_ICON_SLOT}>
                        <Share2 />
                      </span>
                      <span className={cn(NAV_LABEL_CLASS, 'text-left')}>{t('referralEarn')}</span>
                      {referralOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                      )}
                    </button>

                    {referralOpen ? (
                      <div
                        id="sidebar-referral-submenu"
                        role="group"
                        aria-labelledby="sidebar-referral-toggle"
                        className={NAV_WALLET_SUBMENU_CLASS}
                      >
                        {REFERRAL_SECTIONS.map((subItem) => {
                          const subActive = referralActive && isReferralSectionActive(referralSection, subItem.key)
                          return (
                            <Link
                              key={subItem.key}
                              href={subItem.href}
                              aria-current={subActive ? 'page' : undefined}
                              className={referralSubNavItemClass(subActive)}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 shrink-0 rounded-full',
                                  subActive ? 'bg-orange-500' : 'bg-transparent'
                                )}
                                aria-hidden
                              />
                              <span className={NAV_LABEL_CLASS}>{subItem.label}</span>
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
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={navItemClass(isActive)}
                >
                  <span className={NAV_ICON_SLOT}>
                    <Icon />
                  </span>
                  <span className={NAV_LABEL_CLASS}>
                    {t(SIDEBAR_LABEL_KEYS[item.href] as 'dashboard')}
                  </span>
                </Link>
              )
            })}
          </div>

          <div className={NAV_SECTION_DIVIDER}>
            {bottomNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={navItemClass(isActive)}
                >
                  <span className={NAV_ICON_SLOT}>
                    <Icon />
                  </span>
                  <span className={NAV_LABEL_CLASS}>{t(item.labelKey)}</span>
                  {item.href === '/notifications' && unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </div>
        </nav>

        <SidebarUpgradeCard />

        <div className="shrink-0 border-t border-gray-200 px-3 py-3.5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={cn(NAV_ITEM_BASE, NAV_ITEM_INACTIVE, 'disabled:opacity-60')}
          >
            <span className={NAV_ICON_SLOT}>
              <LogOut />
            </span>
            <span className={NAV_LABEL_CLASS}>{loggingOut ? t('loggingOut') : t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
