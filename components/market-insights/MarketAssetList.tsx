'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import type { MarketItem } from '@/lib/data/types'

function MiniSparkline({ up, id }: { up: boolean; id: string }) {
  const stroke = up ? '#10b981' : '#ef4444'
  const line = up
    ? 'M0 18 L10 16 L20 13 L30 10 L40 8'
    : 'M0 8 L10 10 L20 13 L30 15 L40 18'

  return (
    <svg viewBox="0 0 40 20" className="h-5 w-10 shrink-0" fill="none" aria-hidden>
      <path d={line} stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

interface MarketAssetListProps {
  title: string
  markets: MarketItem[]
  emptyMessage?: string
  className?: string
  compact?: boolean
}

function MarketAssetList({
  title,
  markets,
  emptyMessage = 'No assets available',
  className,
  compact = false,
}: MarketAssetListProps) {
  return (
    <div className={cn(dashboardCardClass, 'flex h-full flex-col', className)}>
      <h2 className={dashboardSectionTitleClass}>{title}</h2>
      {markets.length === 0 ? (
        <p className="mt-4 flex flex-1 items-center justify-center text-center text-xs text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className={cn('mt-3 min-h-0 flex-1 space-y-2', compact && 'space-y-1.5')}>
          {markets.map((market) => {
            const up = market.trend === 'up'
            return (
              <li
                key={market.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card text-[10px] font-bold text-foreground shadow-sm">
                    {market.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{market.symbol}</p>
                    {!compact ? (
                      <p className="truncate text-[10px] text-muted-foreground">{market.price}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <MiniSparkline up={up} id={market.id} />
                  <span
                    className={cn(
                      'min-w-[3rem] text-right text-xs font-bold',
                      up ? 'text-emerald-500' : 'text-red-500'
                    )}
                  >
                    {market.change}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default memo(MarketAssetList)
