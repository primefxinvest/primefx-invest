'use client'

import { Crown, Percent, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { KpiCard } from '@/components/shared/kpi'
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
  iconBg?: string
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
      iconBg: 'bg-violet-50 text-violet-600',
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
      iconBg: 'bg-violet-50 text-violet-600',
    },
    {
      label: 'Current rank',
      value: shortRankName(overview.rank.current),
      sub: isMaxRankMetric(overview.rank)
        ? 'Maximum rank'
        : `${overview.rank.membersRemaining} to ${shortRankName(overview.rank.next)}`,
      icon: Crown,
      iconBg: 'bg-violet-50 text-violet-600',
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
            <KpiCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              caption={stat.sub}
              captionClassName="text-muted-foreground"
              icon={Icon ? <Icon className="h-4 w-4 sm:h-5 sm:w-5" /> : undefined}
              iconBg={stat.iconBg}
              className={cn(stat.primary && 'ring-1 ring-[#0052ff]/10')}
            />
          )
        })}
        <HealthScoreGauge score={overview.healthScore} label={overview.healthLabel} />
      </div>
    </section>
  )
}
