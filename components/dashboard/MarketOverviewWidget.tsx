'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

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

export default function MarketOverviewWidget({ markets }: { markets: MarketItem[] }) {
  const t = useTranslations('dashboard')

  return (
    <div className="h-fit rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">{t('marketOverview')}</h3>
        <Link
          href="/market-insights"
          className="flex items-center gap-0.5 text-xs font-semibold text-[#0052ff] hover:underline"
        >
          {t('viewAll')} <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3">
        {markets.map((market) => {
          const up = market.trend === 'up'
          return (
            <div
              key={market.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-gray-700 shadow-sm">
                  {market.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{market.symbol}</p>
                  <p className="text-[10px] text-gray-500">{market.price}</p>
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
