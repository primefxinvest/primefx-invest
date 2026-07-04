'use client'

import { Gauge } from 'lucide-react'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

interface MarketSentimentIndexProps {
  score: number
  label: string
  bullish: number
  bearish: number
}

export default function MarketSentimentIndex({
  score,
  label,
  bullish,
  bearish,
}: MarketSentimentIndexProps) {
  const rotation = -90 + (score / 100) * 180

  return (
    <div className={cn(dashboardCardClass, 'flex h-full flex-col')}>
      <div className="flex items-center justify-between gap-2">
        <h2 className={dashboardSectionTitleClass}>Market Sentiment Index</h2>
        <Gauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </div>

      <div className="mt-4 flex flex-1 flex-col items-center justify-center">
        <div className="relative h-24 w-44 overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-24 w-44 rounded-t-full bg-gradient-to-r from-red-200 via-amber-100 to-emerald-200" />
          <div
            className="absolute bottom-0 left-1/2 h-20 w-0.5 origin-bottom bg-foreground/80 transition-transform duration-500"
            style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            aria-hidden
          />
          <div className="absolute inset-x-4 bottom-0 mx-auto h-16 w-32 rounded-t-full bg-card" />
        </div>
        <p className="mt-2 text-2xl font-bold text-foreground">{score}</p>
        <p className="text-sm font-semibold text-primary">{label}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Bullish</p>
          <p className="text-lg font-bold text-emerald-600">{bullish}</p>
        </div>
        <div className="rounded-lg bg-red-50 px-3 py-2 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-700">Bearish</p>
          <p className="text-lg font-bold text-red-600">{bearish}</p>
        </div>
      </div>
    </div>
  )
}
