'use client'

import { useEffect, useRef, useState } from 'react'
import { m, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Clock, Globe, TrendingUp, Users, Wallet } from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'

type StatConfig = {
  icon: typeof Users
  labelKey: 'statInvestors' | 'statAum' | 'statReturns' | 'statSecure' | 'statCountries'
  display: string
  color: string
}

const STATS: StatConfig[] = [
  {
    icon: Users,
    labelKey: 'statInvestors',
    display: '120K+',
    color: 'bg-blue-100 text-[#0052ff]',
  },
  {
    icon: Wallet,
    labelKey: 'statAum',
    display: '$150M+',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: TrendingUp,
    labelKey: 'statReturns',
    display: '98.9%',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: Clock,
    labelKey: 'statSecure',
    display: '24/7',
    color: 'bg-sky-100 text-sky-600',
  },
  {
    icon: Globe,
    labelKey: 'statCountries',
    display: '150+',
    color: 'bg-orange-100 text-orange-600',
  },
]

function AnimatedStatValue({
  display,
  active,
  reduced,
}: {
  display: string
  active: boolean
  reduced: boolean
}) {
  const numeric = display.match(/[\d.]+/)?.[0]
  const prefix = display.match(/^[^\d]*/)?.[0] ?? ''
  const suffix = display.match(/[^\d.]+$/)?.[0] ?? ''

  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || reduced || !numeric) return

    const target = Number(numeric)
    const duration = 1400
    const start = performance.now()

    let frame: number
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reduced, numeric])

  if (!numeric || reduced || !active) {
    return <span>{display}</span>
  }

  const formatted =
    numeric.includes('.') ? value.toFixed(1) : String(Math.round(value))

  return (
    <span>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}

export default function HeroStatsBar() {
  const t = useTranslations('landing.hero')
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <div
      ref={ref}
      className="relative border-t border-white/60 bg-white/40 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-8xl px-4 py-8 sm:px-6 lg:px-8">
        <m.div
          className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <m.div
                key={stat.labelKey}
                className="group flex items-center gap-3"
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
              >
                <m.div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm',
                    stat.color
                  )}
                  whileHover={reduced ? undefined : { scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-5 w-5" />
                </m.div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-gray-900">
                    <AnimatedStatValue
                      display={stat.display}
                      active={inView}
                      reduced={reduced}
                    />
                  </p>
                  <p className="text-xs font-medium leading-tight text-gray-500">
                    {t(stat.labelKey)}
                  </p>
                </div>
              </m.div>
            )
          })}
        </m.div>
      </div>
    </div>
  )
}
