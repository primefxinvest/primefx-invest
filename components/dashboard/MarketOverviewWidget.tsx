'use client'

import { memo } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { DashboardSectionHeader } from '@/components/dashboard/DashboardSectionHeader'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function Sparkline({ up, id }: { up: boolean; id: string }) {
  const stroke = up ? '#10b981' : '#ef4444'
  const fill = up ? `url(#sparkUp-${id})` : `url(#sparkDown-${id})`
  const line = up
    ? 'M0 22 L8 20 L16 17 L24 14 L32 11 L40 8 L50 6'
    : 'M0 6 L8 9 L16 12 L24 14 L32 17 L40 19 L50 22'
  const area = `${line} L50 24 L0 24 Z`

  return (
    <svg viewBox="0 0 50 24" className="h-7 w-16 shrink-0" fill="none" aria-hidden>
      <defs>
        <linearGradient id={`sparkUp-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`sparkDown-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={fill} />
      <path d={line} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface MarketItem {
  id: string
  symbol: string
  price: string
  change: string
  trend: string
  icon: string
}

function MarketOverviewWidget({
  markets,
  showViewAllLink = true,
}: {
  markets: MarketItem[]
  showViewAllLink?: boolean
}) {
  const t = useTranslations('dashboard')

  return (
    <div className={cn(dashboardCardClass, 'h-fit')}>
      <DashboardSectionHeader
        title={t('marketOverview')}
        action={
          showViewAllLink ? (
            <Link
              href="/market-insights"
              className="flex shrink-0 items-center gap-0.5 rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('viewAll')} <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          ) : null
        }
        className="mb-0"
      />

      <ul className="mt-4 space-y-3 md:space-y-2" aria-label={t('marketOverview')}>
        {markets.map((market) => {
          const up = market.trend === 'up'
          return (
            <li
              key={market.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-3 md:rounded-lg md:border-0 md:px-3 md:py-2.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card text-xs font-bold text-foreground shadow-sm">
                  {market.icon}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{market.symbol}</p>
                  <p className="truncate text-xs text-muted-foreground">{market.price}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Sparkline up={up} id={market.id} />
                <span
                  className={`min-w-[3.5rem] text-right text-sm font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {market.change}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default memo(MarketOverviewWidget)
