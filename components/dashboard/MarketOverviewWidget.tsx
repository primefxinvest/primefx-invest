'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'

function Sparkline({ up, id }: { up: boolean; id: string }) {
  const stroke = up ? '#10b981' : '#ef4444'
  const fill = up ? `url(#sparkUp-${id})` : `url(#sparkDown-${id})`
  const line = up
    ? 'M0 22 L8 20 L16 17 L24 14 L32 11 L40 8 L50 6'
    : 'M0 6 L8 9 L16 12 L24 14 L32 17 L40 19 L50 22'
  const area = `${line} L50 24 L0 24 Z`

  return (
    <svg viewBox="0 0 50 24" className="h-7 w-16" fill="none">
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

export default function MarketOverviewWidget({
  markets,
  showViewAllLink = true,
}: {
  markets: MarketItem[]
  showViewAllLink?: boolean
}) {
  const t = useTranslations('dashboard')

  return (
    <div className={dashboardCardClass + ' h-fit'}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={dashboardSectionTitleClass}>{t('marketOverview')}</h3>
        {showViewAllLink ? (
          <Link
            href="/market-insights"
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            {t('viewAll')} <ArrowRight className="h-3 w-3" />
          </Link>
        ) : null}
      </div>

      <div className="space-y-2">
        {markets.map((market) => {
          const up = market.trend === 'up'
          return (
            <div
              key={market.id}
              className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-2 sm:px-3 sm:py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-[10px] font-bold text-foreground shadow-sm sm:h-7 sm:w-7 sm:text-xs">
                  {market.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold text-foreground">{market.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">{market.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Sparkline up={up} id={market.id} />
                <span
                  className={`text-xs font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  {market.change}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
