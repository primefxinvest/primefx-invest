'use client'

import { useEffect, useRef, useState, memo, type ReactNode } from 'react'
import {
  Activity,
  BarChart3,
  Bot,
  Calendar,
  Globe,
  Home,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'
import './hero-dashboard.css'

function MiniSparkline({ color = '#10b981', className }: { color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 80 32"
      className={cn('h-7 w-full', className)}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 24 L12 20 L24 22 L36 14 L48 16 L60 8 L72 10 L80 4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type FloatingWidgetProps = {
  children: ReactNode
  className: string
  delayIndex: 0 | 1 | 2 | 3 | 4
  compact?: boolean
}

const FloatingWidget = memo(function FloatingWidget({
  children,
  className,
  delayIndex,
  compact = false,
}: FloatingWidgetProps) {
  return (
    <div
      className={cn(
        'hero-widget-float absolute z-30',
        `hero-widget-float--${delayIndex}`,
        className
      )}
    >
      <div
        className={cn(
          'rounded-xl border border-white/50 bg-white/55 backdrop-blur-md',
          compact ? 'p-2 shadow-md shadow-blue-900/5' : 'p-3 shadow-lg shadow-blue-900/6'
        )}
      >
        {children}
      </div>
    </div>
  )
})

const MARKET_TICKERS = [
  { symbol: 'BTC', change: '+2.41%' },
  { symbol: 'EUR/USD', change: '+0.18%' },
  { symbol: 'NASDAQ', change: '+1.24%' },
]

function HeroDashboardScene() {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [animationsActive, setAnimationsActive] = useState(false)

  useEffect(() => {
    if (reduced) return

    const element = containerRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => setAnimationsActive(entry.isIntersecting),
      { rootMargin: '80px', threshold: 0 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [reduced])

  const paused = reduced || !animationsActive

  return (
    <div
      ref={containerRef}
      className={cn(
        'hero-scene-enter relative mx-auto h-[280px] w-full max-w-[580px] md:h-[560px] lg:mx-0 lg:max-w-none',
        paused && 'hero-scene-paused'
      )}
    >
      <div className="hidden md:contents">
        <FloatingWidget className="right-0 top-2 w-36" delayIndex={0}>
          <p className="text-[10px] font-medium text-gray-500">Profit Today</p>
          <p className="text-lg font-bold text-emerald-500">+$842.50</p>
          <MiniSparkline />
        </FloatingWidget>

        <FloatingWidget className="-right-3 top-36 w-36" delayIndex={1}>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-purple-500" />
            <p className="text-[10px] font-medium text-gray-500">Total Investors</p>
          </div>
          <p className="text-lg font-bold text-gray-900">120,482</p>
        </FloatingWidget>

        <FloatingWidget className="bottom-28 left-0 hidden w-40 lg:block" delayIndex={2}>
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-[10px] font-semibold text-gray-700">Live Trades</p>
          </div>
          <p className="mt-0.5 text-sm font-bold text-gray-900">2,847 active</p>
        </FloatingWidget>
      </div>

      <FloatingWidget
        className="right-0 top-0 w-28 md:-left-2 md:top-16 md:w-32"
        delayIndex={3}
        compact
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-[#0052ff] md:h-3.5 md:w-3.5" />
          <p className="text-[9px] font-semibold text-gray-700 md:text-[10px]">Weekly ROI</p>
        </div>
        <p className="mt-0.5 text-base font-bold text-[#0052ff] md:mt-1 md:text-xl">+3.2%</p>
      </FloatingWidget>

      <FloatingWidget
        className="bottom-4 right-0 w-28 md:bottom-20 md:w-36"
        delayIndex={4}
        compact
      >
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3 w-3 text-[#0052ff] md:h-3.5 md:w-3.5" />
          <p className="text-[9px] font-medium text-gray-500 md:text-[10px]">Total Deposits</p>
        </div>
        <p className="text-base font-bold text-gray-900 md:text-lg">$150M+</p>
      </FloatingWidget>

      <div className="absolute left-1/2 top-6 z-20 w-full max-w-[300px] -translate-x-1/2 md:top-1/2 md:max-w-[480px] md:-translate-y-[45%]">
        <div className="hero-dashboard-float">
          <div className="relative origin-top scale-[0.92] overflow-hidden rounded-[1.25rem] border border-white/50 bg-white/45 shadow-lg shadow-blue-900/5 backdrop-blur-xl md:scale-100 md:rounded-[1.75rem] md:bg-white/50 md:shadow-xl md:shadow-blue-900/8">
            <div className="relative flex overflow-hidden">
              <div className="flex w-9 shrink-0 flex-col items-center gap-3 bg-gradient-to-b from-[#0f1f4d] to-[#162a5c] py-3 md:w-12 md:gap-4 md:py-5">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0052ff] md:h-7 md:w-7">
                  <span className="text-[10px] font-bold text-white md:text-xs">P</span>
                </div>
                {[Home, BarChart3, Calendar, Wallet, Settings].map((Icon, i) => (
                  <Icon
                    key={i}
                    className={cn('h-3 w-3 md:h-4 md:w-4', i === 0 ? 'text-white' : 'text-white/35')}
                  />
                ))}
              </div>

              <div className="min-w-0 flex-1 p-2.5 md:p-4">
                <div className="mb-2 flex items-start justify-between gap-2 md:mb-3">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-900 md:text-sm">
                      Welcome back, <span className="text-[#0052ff]">Investor</span>
                    </p>
                    <p className="text-[10px] text-gray-500 md:text-xs">Portfolio overview</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 md:px-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[8px] font-semibold text-emerald-600 md:text-[9px]">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                  <div className="rounded-lg border border-gray-100/80 bg-gradient-to-br from-gray-50/90 to-white p-2 md:rounded-xl md:p-3">
                    <p className="text-[9px] font-medium text-gray-500 md:text-[10px]">Portfolio Value</p>
                    <p className="text-sm font-bold text-gray-900 md:text-lg">$24,567.89</p>
                    <p className="text-[9px] font-semibold text-emerald-500 md:text-[10px]">+22.81%</p>
                    <MiniSparkline className="h-5 md:h-7" />
                  </div>

                  <div className="relative overflow-hidden rounded-lg border border-purple-100/80 bg-gradient-to-br from-purple-50/80 to-white p-2 md:rounded-xl md:p-3">
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-600" />
                      <span className="text-[9px] font-bold text-purple-700 md:text-[10px]">PrimeAI</span>
                    </div>
                    <div className="relative mx-auto mt-1 flex h-10 w-10 items-center justify-center md:mt-2 md:h-14 md:w-14">
                      <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#0052ff] to-purple-600 md:inset-1" />
                      <Bot className="relative h-4 w-4 text-white md:h-5 md:w-5" />
                    </div>
                  </div>

                  <div className="col-span-2 rounded-lg border border-gray-100/80 bg-white/90 p-2 md:rounded-xl md:p-2.5">
                    <div className="mb-1 flex items-center gap-1">
                      <Globe className="h-2.5 w-2.5 text-[#0052ff] md:h-3 md:w-3" />
                      <p className="text-[9px] font-bold text-gray-800 md:text-[10px]">Market Insights</p>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-1.5">
                      {MARKET_TICKERS.map((ticker) => (
                        <div
                          key={ticker.symbol}
                          className="flex items-center gap-1 rounded-md bg-gray-50 px-1.5 py-0.5 md:rounded-lg md:px-2 md:py-1"
                        >
                          <span className="text-[8px] font-semibold text-gray-700 md:text-[9px]">
                            {ticker.symbol}
                          </span>
                          <span className="text-[8px] font-bold text-emerald-500 md:text-[9px]">
                            {ticker.change}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(HeroDashboardScene)
