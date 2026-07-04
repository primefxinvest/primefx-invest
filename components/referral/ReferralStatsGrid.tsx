'use client'

import { Crown, Percent, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import { cn } from '@/lib/utils'

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

function isMaxRankMetric(rank: ReferralProgramOverview['rank']) {
  return rank.current === rank.next
}

function healthScoreStyles(label: string) {
  if (label === 'Excellent') return { stroke: '#10b981', text: 'text-emerald-600' }
  if (label === 'Good') return { stroke: '#0052ff', text: 'text-[#0052ff]' }
  return { stroke: '#f59e0b', text: 'text-amber-600' }
}

function HealthScoreGauge({ score, label }: { score: number; label: string }) {
  const size = 80
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score))
  const offset = circumference - (progress / 100) * circumference
  const { stroke: strokeColor, text: labelColor } = healthScoreStyles(label)

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Network health</p>
      <div className="relative mt-3">
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-400">/100</span>
        </div>
      </div>
      <p className={cn('mt-2 text-sm font-semibold', labelColor)}>{label}</p>
    </div>
  )
}

type StatCard = {
  label: string
  value: string
  trend?: string
  sub?: string
  icon?: LucideIcon
  primary?: boolean
}

type ReferralStatsGridProps = {
  overview: ReferralProgramOverview
}

export function ReferralStatsGrid({ overview }: ReferralStatsGridProps) {
  const conversionDisplay = `${Number(overview.funnel.conversionRate).toFixed(1)}%`

  const stats: StatCard[] = [
    {
      label: 'Lifetime earnings',
      value: formatCurrency(overview.lifetimeEarnings),
      trend: overview.trends.lifetime,
      primary: true,
    },
    {
      label: 'This week',
      value: formatCurrency(overview.thisWeekEarnings),
      trend: overview.trends.week,
    },
    {
      label: 'This month',
      value: formatCurrency(overview.thisMonthEarnings),
      trend: overview.trends.month,
      primary: true,
    },
    {
      label: 'Active investors',
      value: String(overview.activeInvestors),
      trend: overview.trends.newInvestors,
      icon: Users,
    },
    {
      label: 'Total referrals',
      value: String(overview.totalReferrals),
    },
    {
      label: 'Conversion rate',
      value: conversionDisplay,
      sub: 'Signups → active investors',
      icon: Percent,
    },
    {
      label: 'Current rank',
      value: shortRankName(overview.rank.current),
      sub: isMaxRankMetric(overview.rank)
        ? 'Maximum rank'
        : `${overview.rank.membersRemaining} to ${shortRankName(overview.rank.next)}`,
      icon: Crown,
    },
  ]

  return (
    <section aria-label="Referral statistics" className="space-y-3">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        Performance overview
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-[repeat(7,minmax(0,1fr))_auto]">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className={cn(
                'rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
                stat.primary && 'ring-1 ring-[#0052ff]/10'
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 sm:text-[11px]">
                {stat.label}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {Icon ? <Icon className="h-4 w-4 shrink-0 text-violet-600" aria-hidden="true" /> : null}
                <p
                  className={cn(
                    'font-bold tabular-nums leading-tight text-gray-900',
                    stat.primary ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                  )}
                >
                  {stat.value}
                </p>
              </div>
              {stat.trend ? (
                <p className="mt-1 text-[11px] font-semibold text-emerald-600">{stat.trend}</p>
              ) : null}
              {stat.sub ? (
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-gray-400">{stat.sub}</p>
              ) : null}
            </div>
          )
        })}
        <HealthScoreGauge score={overview.healthScore} label={overview.healthLabel} />
      </div>
    </section>
  )
}
