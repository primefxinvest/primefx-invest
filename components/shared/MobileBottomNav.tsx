'use client'

import { useTranslations } from 'next-intl'
import { m } from 'framer-motion'
import { Link, usePathname } from '@/i18n/navigation'
import { Home, PieChart, TrendingUp, Wallet } from 'lucide-react'
import { CARD_TAP } from '@/lib/motion/tokens'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

const primaryItems = [
  { href: '/dashboard', labelKey: 'dashboard', icon: Home },
  { href: '/invest', labelKey: 'invest', icon: TrendingUp },
  { href: '/portfolio', labelKey: 'portfolio', icon: PieChart },
  { href: '/wallet', labelKey: 'wallet', icon: Wallet },
] as const

export default function MobileBottomNav() {
  const t = useTranslations('sidebar')
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()
  const TapWrapper = reducedMotion ? 'div' : m.div

  return (
    <nav
      aria-label={t('mobileNav')}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden"
    >
      <div className="mx-auto grid h-14 max-w-lg grid-cols-4 px-1">
        {primaryItems.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href === '/wallet' && pathname.startsWith('/wallet')) ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`))

          return (
            <TapWrapper key={item.href} whileTap={reducedMotion ? undefined : CARD_TAP}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] transition-colors',
                  active
                    ? 'font-semibold text-[#0052ff]'
                    : 'font-medium text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn('h-5 w-5 shrink-0', active ? 'text-[#0052ff] stroke-[2.25]' : 'text-gray-400')}
                  aria-hidden
                />
                <span className="max-w-full truncate">{t(item.labelKey)}</span>
              </Link>
            </TapWrapper>
          )
        })}
      </div>
    </nav>
  )
}
