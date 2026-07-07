'use client'

import { useCallback, useRef, useState } from 'react'
import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
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
  Zap,
} from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

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

type FloatingCardProps = {
  children: React.ReactNode
  className?: string
  delay?: number
  depth?: number
  mouseX: MotionValue<number>
  mouseY: MotionValue<number>
  reduced: boolean
}

function FloatingCard({
  children,
  className,
  delay = 0,
  depth = 1,
  mouseX,
  mouseY,
  reduced,
}: FloatingCardProps) {
  const parallaxX = useTransform(mouseX, [-0.5, 0.5], [-8 * depth, 8 * depth])
  const parallaxY = useTransform(mouseY, [-0.5, 0.5], [-6 * depth, 6 * depth])

  return (
    <m.div
      className={cn('absolute', className)}
      style={{
        x: reduced ? 0 : parallaxX,
        y: reduced ? 0 : parallaxY,
        willChange: 'transform',
      }}
    >
      <m.div
        className="rounded-2xl border border-white/70 bg-white/75 p-3 shadow-xl shadow-blue-900/10 backdrop-blur-xl"
        animate={reduced ? undefined : { y: [0, -10, 0] }}
        transition={{
          y: { duration: 5 + delay, repeat: Infinity, ease: 'easeInOut', delay },
        }}
        whileHover={reduced ? undefined : { scale: 1.04, y: -4 }}
      >
        {children}
      </m.div>
    </m.div>
  )
}

const MARKET_TICKERS = [
  { symbol: 'BTC', change: '+2.41%', up: true },
  { symbol: 'EUR/USD', change: '+0.18%', up: true },
  { symbol: 'NASDAQ', change: '+1.24%', up: true },
  { symbol: 'Gold', change: '+0.87%', up: true },
  { symbol: 'S&P500', change: '-0.12%', up: false },
]

const AI_MESSAGES = [
  'Portfolio optimized',
  'Risk within target',
  'New opportunity detected',
]

export default function HeroDashboardScene() {
  const reduced = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hovering, setHovering] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 120, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 120, damping: 20 })

  const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-10, 10])
  const glowX = useTransform(springX, [-0.5, 0.5], ['40%', '60%'])

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (reduced) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      mouseX.set((event.clientX - rect.left) / rect.width - 0.5)
      mouseY.set((event.clientY - rect.top) / rect.height - 0.5)
    },
    [mouseX, mouseY, reduced]
  )

  const handleMouseLeave = useCallback(() => {
    setHovering(false)
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  return (
    <m.div
      ref={containerRef}
      className="relative mx-auto h-[520px] w-full max-w-[580px] sm:h-[560px] lg:mx-0 lg:max-w-none"
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1400 }}
    >
      <m.div
        className="pointer-events-none absolute inset-4 rounded-[2rem] bg-blue-500/20 blur-3xl"
        style={{ x: reduced ? 0 : glowX }}
        animate={reduced ? undefined : { opacity: hovering ? 0.55 : 0.35 }}
      />

      <FloatingCard
        className="right-0 top-2 z-30 hidden w-36 sm:block"
        delay={0.2}
        depth={1.4}
        mouseX={springX}
        mouseY={springY}
        reduced={reduced}
      >
        <p className="text-[10px] font-medium text-gray-500">Profit Today</p>
        <p className="text-lg font-bold text-emerald-500">+$842.50</p>
        <MiniSparkline />
      </FloatingCard>

      <FloatingCard
        className="-left-2 top-16 z-30 w-32"
        delay={0.6}
        depth={1.2}
        mouseX={springX}
        mouseY={springY}
        reduced={reduced}
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-[#0052ff]" />
          <p className="text-[10px] font-semibold text-gray-700">Weekly ROI</p>
        </div>
        <p className="mt-1 text-xl font-bold text-[#0052ff]">+3.2%</p>
      </FloatingCard>

      <FloatingCard
        className="-right-3 top-36 z-30 hidden w-36 md:block"
        delay={1}
        depth={1.6}
        mouseX={springX}
        mouseY={springY}
        reduced={reduced}
      >
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-purple-500" />
          <p className="text-[10px] font-medium text-gray-500">Total Investors</p>
        </div>
        <p className="text-lg font-bold text-gray-900">120,482</p>
      </FloatingCard>

      <FloatingCard
        className="bottom-28 left-0 z-30 hidden w-40 lg:block"
        delay={0.4}
        depth={1.3}
        mouseX={springX}
        mouseY={springY}
        reduced={reduced}
      >
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          <p className="text-[10px] font-semibold text-gray-700">Live Trades</p>
        </div>
        <p className="mt-0.5 text-sm font-bold text-gray-900">2,847 active</p>
        <m.div
          className="mt-1 flex gap-1"
          animate={reduced ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          ))}
        </m.div>
      </FloatingCard>

      <FloatingCard
        className="bottom-20 right-0 z-30 w-36"
        delay={0.8}
        depth={1.5}
        mouseX={springX}
        mouseY={springY}
        reduced={reduced}
      >
        <div className="flex items-center gap-1.5">
          <Wallet className="h-3.5 w-3.5 text-[#0052ff]" />
          <p className="text-[10px] font-medium text-gray-500">Total Deposits</p>
        </div>
        <p className="text-lg font-bold text-gray-900">$150M+</p>
      </FloatingCard>

      <m.div
        className="absolute left-1/2 top-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 -translate-y-[45%]"
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/80 shadow-2xl shadow-blue-900/15 backdrop-blur-2xl">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/90 via-transparent to-blue-50/50"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl"
            aria-hidden
          />

          <div className="relative flex overflow-hidden">
            <div className="flex w-12 shrink-0 flex-col items-center gap-4 bg-gradient-to-b from-[#0f1f4d] to-[#162a5c] py-5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0052ff] shadow-lg shadow-blue-500/40">
                <span className="text-xs font-bold text-white">P</span>
              </div>
              {[Home, BarChart3, Calendar, Wallet, Settings].map((Icon, i) => (
                <Icon
                  key={i}
                  className={cn('h-4 w-4', i === 0 ? 'text-white' : 'text-white/35')}
                />
              ))}
            </div>

            <div className="min-w-0 flex-1 p-4">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Welcome back, <span className="text-[#0052ff]">Investor</span>
                  </p>
                  <p className="text-xs text-gray-500">Portfolio overview</p>
                </div>
                <m.div
                  className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5"
                  animate={reduced ? undefined : { scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-semibold text-emerald-600">Live</span>
                </m.div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-100/80 bg-gradient-to-br from-gray-50/90 to-white p-3">
                  <p className="text-[10px] font-medium text-gray-500">Portfolio Value</p>
                  <p className="text-lg font-bold text-gray-900">$24,567.89</p>
                  <p className="text-[10px] font-semibold text-emerald-500">+22.81%</p>
                  <MiniSparkline />
                </div>

                <div className="relative overflow-hidden rounded-xl border border-purple-100/80 bg-gradient-to-br from-purple-50/80 to-white p-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-700">PrimeAI</span>
                  </div>
                  <div className="relative mx-auto mt-2 flex h-14 w-14 items-center justify-center">
                    <m.div
                      className="absolute inset-0 rounded-full border-2 border-purple-300/50"
                      animate={reduced ? undefined : { scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 2.5, repeat: Infinity }}
                    />
                    <m.div
                      className="absolute inset-1 rounded-full bg-gradient-to-br from-[#0052ff] to-purple-600 shadow-lg shadow-purple-500/30"
                      animate={reduced ? undefined : { boxShadow: ['0 0 20px rgba(99,102,241,0.3)', '0 0 35px rgba(0,82,255,0.45)', '0 0 20px rgba(99,102,241,0.3)'] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                    <Bot className="relative h-5 w-5 text-white" />
                  </div>
                  <m.div
                    className="mt-1 flex items-center justify-center gap-1"
                    animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {[0, 1, 2].map((i) => (
                      <m.span
                        key={i}
                        className="h-1 w-1 rounded-full bg-purple-500"
                        animate={reduced ? undefined : { y: [0, -3, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </m.div>
                </div>

                <div className="col-span-2 rounded-xl border border-gray-100/80 bg-white/90 p-2.5">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-[#0052ff]" />
                    <p className="text-[10px] font-bold text-gray-800">Market Insights</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {MARKET_TICKERS.map((ticker) => (
                      <div
                        key={ticker.symbol}
                        className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1"
                      >
                        <span className="text-[9px] font-semibold text-gray-700">
                          {ticker.symbol}
                        </span>
                        <span
                          className={cn(
                            'text-[9px] font-bold',
                            ticker.up ? 'text-emerald-500' : 'text-red-500'
                          )}
                        >
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
      </m.div>

      {AI_MESSAGES.map((message, index) => (
        <m.div
          key={message}
          className="absolute z-40 hidden rounded-xl border border-purple-100/80 bg-white/90 px-2.5 py-1.5 text-[9px] font-medium text-purple-700 shadow-lg backdrop-blur-sm lg:block"
          style={{
            left: `${58 + index * 4}%`,
            top: `${28 + index * 12}%`,
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={
            reduced
              ? { opacity: 0.9, y: 0 }
              : { opacity: [0, 1, 1, 0], y: [8, 0, 0, -6] }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: index * 1.4,
            ease: 'easeInOut',
          }}
        >
          <Zap className="mr-1 inline h-2.5 w-2.5" />
          {message}
        </m.div>
      ))}
    </m.div>
  )
}
