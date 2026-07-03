'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  ChevronRight,
  CircleDollarSign,
  Copy,
  Crown,
  Gem,
  Gift,
  HelpCircle,
  Mail,
  Medal,
  MessageCircle,
  Share2,
  Shield,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { AsyncState, EmptyState, ErrorState } from '@/components/shared/data-state'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
import { MetricCardsSkeleton, PageHeaderSkeleton } from '@/components/shared/skeletons'
import {
  areaChartActiveDot,
  chartAxisStyle,
  chartGridStyle,
  ChartTooltipContent,
  chartTooltipCursor,
  chartTooltipWrapperProps,
  formatCurrency as formatChartCurrency,
  PieTooltipContent,
} from '@/components/charts/ChartTooltip'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { formatCurrency } from '@/lib/data/format'
import { fetchReferralProgramOverviewAction } from '@/lib/referral/actions'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralProgramPageData } from '@/lib/referral/overview-server'
import {
  REFERRAL_INVESTMENT_COMMISSION_RATE,
  REFERRAL_RANK_TIERS,
  REFERRAL_WELCOME_BONUS_USD,
  formatProfitShareLevelsSummary,
  formatReferralRate,
  getMaxProfitShareRate,
  type ReferralRankKey,
} from '@/lib/referral/program-config'
import { cn } from '@/lib/utils'

const BENEFIT_CARDS = [
  {
    title: 'Welcome Bonus',
    lead: 'You & your friend get ',
    highlight: `$${REFERRAL_WELCOME_BONUS_USD} Investment Credit`,
    footer: 'After first deposit & KYC',
    icon: Gift,
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Investment Commission',
    lead: '',
    highlight: `Earn ${formatReferralRate(REFERRAL_INVESTMENT_COMMISSION_RATE)} on every deposit`,
    footer: 'One-time commission',
    icon: CircleDollarSign,
    accent: 'bg-orange-50 text-orange-500',
  },
  {
    title: 'Weekly Profit Share',
    lead: '',
    highlight: `Earn up to ${formatReferralRate(getMaxProfitShareRate())} weekly`,
    footer: 'Lifetime earnings',
    icon: TrendingUp,
    accent: 'bg-blue-50 text-[#0052ff]',
  },
  {
    title: '4 Levels Deep',
    lead: '',
    highlight: formatProfitShareLevelsSummary(),
    footer: 'Unlimited generations',
    icon: Users,
    accent: 'bg-emerald-50 text-emerald-600',
  },
] as const

const SHARE_ACTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', icon: Zap, color: 'text-[#0052ff]' },
  { key: 'facebook', label: 'Facebook', icon: Share2, color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-gray-600' },
  { key: 'sms', label: 'SMS', icon: MessageCircle, color: 'text-violet-600' },
  { key: 'copy', label: 'Copy', icon: Copy, color: 'text-gray-700' },
] as const

function funnelBarWidth(value: number, total: number, minPercent = 20) {
  if (total <= 0) return `${minPercent}%`
  const percent = (value / total) * 100
  return `${Math.max(minPercent, Math.min(100, percent))}%`
}

function healthScoreStyles(label: string) {
  if (label === 'Excellent') {
    return { stroke: '#10b981', text: 'text-emerald-600' }
  }
  if (label === 'Good') {
    return { stroke: '#0052ff', text: 'text-[#0052ff]' }
  }
  return { stroke: '#f59e0b', text: 'text-amber-600' }
}

function ReferralHealthScoreGauge({ score, label }: { score: number; label: string }) {
  const size = 96
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(100, Math.max(0, score))
  const offset = circumference - (progress / 100) * circumference
  const { stroke: strokeColor, text: labelColor } = healthScoreStyles(label)

  return (
    <div className="flex h-full min-h-[148px] flex-col rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm xl:min-w-[180px]">
      <p className="text-[11px] font-medium text-gray-500">Health Score</p>
      <div className="mt-3 flex flex-1 items-end justify-between gap-2">
        <div className="relative shrink-0">
          <svg width={size} height={size} className="-rotate-90" aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={stroke}
            />
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
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold leading-none text-gray-900">
              {score}
              <span className="text-[11px] font-medium text-gray-400"> /100</span>
            </span>
          </div>
        </div>
        <p className={cn('pb-1 text-right text-sm font-semibold', labelColor)}>{label}</p>
      </div>
    </div>
  )
}

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

function resolveRankKeyFromName(name: string): ReferralRankKey {
  const tier = REFERRAL_RANK_TIERS.find((row) => row.name === name)
  return tier?.key ?? 'bronze'
}

const RANK_BADGE_STYLES: Record<
  ReferralRankKey,
  { shell: string; icon: typeof Gem; iconClass: string; nameClass: string }
> = {
  bronze: {
    shell: 'bg-gradient-to-br from-amber-100 to-orange-100 ring-amber-200/80',
    icon: Medal,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-800',
  },
  silver: {
    shell: 'bg-gradient-to-br from-slate-100 to-gray-200 ring-slate-200/80',
    icon: Shield,
    iconClass: 'text-slate-600',
    nameClass: 'text-slate-700',
  },
  gold: {
    shell: 'bg-gradient-to-br from-yellow-100 to-amber-100 ring-amber-200/80',
    icon: Award,
    iconClass: 'text-amber-600',
    nameClass: 'text-amber-700',
  },
  platinum: {
    shell: 'bg-gradient-to-br from-blue-100 to-indigo-100 ring-blue-200/80',
    icon: Star,
    iconClass: 'text-blue-600',
    nameClass: 'text-blue-700',
  },
  diamond: {
    shell: 'bg-gradient-to-br from-violet-100 to-purple-200 ring-violet-200/80',
    icon: Gem,
    iconClass: 'text-violet-600',
    nameClass: 'text-violet-700',
  },
  ambassador: {
    shell: 'bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-200 ring-amber-300/80',
    icon: Crown,
    iconClass: 'text-amber-700',
    nameClass: 'text-amber-700',
  },
}

function ReferralRankBadge({ rankName }: { rankName: string; variant: 'current' | 'next' }) {
  const rankKey = resolveRankKeyFromName(rankName)
  const style = RANK_BADGE_STYLES[rankKey]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'relative flex h-14 w-12 shrink-0 items-center justify-center shadow-sm [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]',
        style.shell
      )}
    >
      <Icon className={cn('h-7 w-7', style.iconClass)} />
    </div>
  )
}

function ReferralRankSide({
  rankName,
  variant,
  caption,
}: {
  rankName: string
  variant: 'current' | 'next'
  caption: string
}) {
  const style = RANK_BADGE_STYLES[resolveRankKeyFromName(rankName)]
  const short = shortRankName(rankName)

  return (
    <div className="flex items-center gap-4 px-5 py-5 lg:px-6">
      <ReferralRankBadge rankName={rankName} variant={variant} />
      <div className="min-w-0">
        <p className={cn('text-lg font-bold leading-tight', style.nameClass)}>{short}</p>
        <p className="mt-1 text-xs text-gray-400">{caption}</p>
      </div>
    </div>
  )
}

function ReferralRankProgressPanel({ rank }: { rank: ReferralProgramOverview['rank'] }) {
  const nextShort = shortRankName(rank.next)
  const isMaxRank = rank.current === rank.next

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="shrink-0 border-b border-gray-200 lg:border-b-0">
          <ReferralRankSide rankName={rank.current} variant="current" caption="Your Current Rank" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center border-b border-gray-200 px-5 py-5 lg:border-b-0 lg:border-x lg:px-8">
          <div className="flex items-center justify-between gap-4 text-xs text-slate-500">
            <span>{isMaxRank ? 'Maximum rank achieved' : `Progress to ${nextShort}`}</span>
            <span className="tabular-nums">
              <span className="font-bold text-slate-900">
                {rank.activeInvestors.toLocaleString()}
              </span>
              <span className="text-slate-400"> / {rank.nextThreshold.toLocaleString()}</span>
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <p className="shrink-0 text-xl font-bold text-slate-900">
              {rank.nextThreshold.toLocaleString()} Active Investors
            </p>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all duration-700"
                  style={{
                    width: `${Math.max(rank.progressPercent, rank.progressPercent > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="shrink-0 text-sm font-semibold text-violet-600">
                {rank.progressPercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <ReferralRankSide
            rankName={rank.next}
            variant="next"
            caption={isMaxRank ? 'Top Rank' : 'Next Rank'}
          />
        </div>
      </div>
    </div>
  )
}

function NetworkLevelConnector() {
  return (
    <div
      className="relative z-10 flex w-10 shrink-0 justify-center self-start sm:w-14"
      aria-hidden
    >
      <div className="flex flex-col items-center pt-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white" />
        <div className="h-16 w-px bg-gray-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300 ring-4 ring-white" />
      </div>
    </div>
  )
}

function NetworkLevelColumn({
  level,
  index,
}: {
  level: ReferralProgramOverview['networkLevels'][number]
  index: number
}) {
  const visibleMembers = level.members.slice(0, 4)
  const overflow = Math.max(0, level.count - visibleMembers.length)
  const levelNumber = index + 1

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center px-1 sm:px-2">
      <p className="relative z-10 bg-white px-2 text-center text-sm font-semibold text-slate-800">
        Level {levelNumber} ({level.count})
      </p>

      <div className="mt-8 flex min-h-[44px] items-center justify-center">
        {level.count > 0 ? (
          visibleMembers.length > 0 ? (
            <div className="flex items-center">
              <div className="flex -space-x-2.5">
                {visibleMembers.map((member, memberIndex) => (
                  <span
                    key={member.id}
                    title={member.name}
                    className={cn(
                      'inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white shadow-sm',
                      memberIndex % 4 === 0 && 'bg-[#0052ff]',
                      memberIndex % 4 === 1 && 'bg-violet-500',
                      memberIndex % 4 === 2 && 'bg-sky-500',
                      memberIndex % 4 === 3 && 'bg-indigo-500'
                    )}
                  >
                    {member.initials}
                  </span>
                ))}
              </div>
              {overflow > 0 ? (
                <span className="ml-2 text-sm font-semibold text-[#0052ff]">+{overflow}</span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#0052ff]">+{level.count}</span>
          )
        ) : (
          <p className="text-xs text-gray-400">No members yet</p>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-slate-500">
        Total Earnings:{' '}
        <span className="font-bold text-emerald-600">{formatCurrency(level.earnings)}</span>
      </p>
    </div>
  )
}

function ReferralNetworkPanel({
  levels,
}: {
  levels: ReferralProgramOverview['networkLevels']
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">My Referral Network</h3>
        <Link
          href="/referral#all-referrals"
          className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 hover:underline"
        >
          View Full Network
        </Link>
      </div>

      <div className="relative mt-10 flex flex-1 items-start overflow-x-auto pb-2">
        <div
          className="pointer-events-none absolute inset-x-4 top-3 h-px bg-gray-200 sm:inset-x-6"
          aria-hidden
        />

        <div className="relative flex min-w-full items-start justify-between">
          {levels.map((level, index) => (
            <Fragment key={level.level}>
              <NetworkLevelColumn level={level} index={index} />
              {index < levels.length - 1 ? <NetworkLevelConnector /> : null}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

function ReferralChannelsPanel({
  channels,
}: {
  channels: ReferralProgramOverview['channels']
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">Top Performing Channels</h3>
      <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
        {channels.map((channel) => (
          <div key={channel.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-800">{channel.name}</span>
              <span className="font-medium text-gray-500">{channel.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReferralFunnelPanel({ funnel }: { funnel: ReferralProgramOverview['funnel'] }) {
  const steps = [
    { label: 'Clicks', value: funnel.clicks, width: '100%' },
    {
      label: 'Signups',
      value: funnel.signups,
      width: funnelBarWidth(funnel.signups, funnel.clicks),
    },
    {
      label: 'Active Investors',
      value: funnel.activeInvestors,
      width: funnelBarWidth(funnel.activeInvestors, funnel.clicks, funnel.activeInvestors > 0 ? 20 : 28),
    },
  ]

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-gray-900">Conversion Funnel</h3>
      <div className="mt-5 flex flex-1 flex-col justify-center space-y-4">
        {steps.map((step) => (
          <div key={step.label}>
            <div className="mb-1 flex justify-end">
              <span className="text-sm font-bold text-gray-900">{step.value.toLocaleString()}</span>
            </div>
            <div className="h-9 overflow-hidden rounded-lg bg-gray-100">
              <div
                className="flex h-full min-w-[7rem] items-center rounded-lg bg-gradient-to-r from-[#0052ff] to-violet-500 px-3"
                style={{ width: step.width }}
              >
                <span className="truncate text-[11px] font-semibold text-white">{step.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-sm font-semibold text-emerald-600">
        Conversion Rate: {funnel.conversionRate}%
      </p>
    </div>
  )
}

function buildShareUrl(channel: string, link: string, code: string) {
  const text = `Join me on PrimeFx Invest and start investing smarter. Use my referral link: ${link}`
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(text)}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Join PrimeFx Invest')}&body=${encodeURIComponent(text)}`
    case 'sms':
      return `sms:?body=${encodeURIComponent(text)}`
    default:
      return link
  }
}

export function ReferralProgramView({
  initialOverview = null,
}: {
  initialOverview?: ReferralProgramPageData | null
}) {
  const { data, loading, error, reload } = useAsyncData(
    () => fetchReferralProgramOverviewAction(),
    [],
    initialOverview ?? undefined
  )
  const [chartPeriod, setChartPeriod] = useState<'30' | '90' | '365'>('30')
  const [chartsReady, setChartsReady] = useState(false)

  useEffect(() => {
    setChartsReady(true)
  }, [])

  const referralData = data?.referralData
  const referrals = data?.referrals ?? []
  const overview = data?.overview

  const copyLink = async () => {
    if (!referralData?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async (channel: string) => {
    if (!referralData?.referralLink) return
    if (channel === 'copy') {
      await copyLink()
      return
    }
    window.open(
      buildShareUrl(channel, referralData.referralLink, referralData.referralCode),
      '_blank',
      'noopener,noreferrer'
    )
  }

  const chartData = useMemo(() => {
    if (!overview) return []
    const slice = chartPeriod === '30' ? 6 : chartPeriod === '90' ? 9 : 12
    return overview.earningsChart.slice(-slice)
  }, [overview, chartPeriod])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <MetricCardsSkeleton count={4} />
        <MetricCardsSkeleton count={3} />
      </div>
    )
  }

  if (error && !data) {
    return (
      <ErrorState title="Could not load referral program" description={error} onRetry={reload} />
    )
  }

  if (!overview || !referralData) return null

  const metricCards = [
    { label: 'Lifetime Earnings', value: formatCurrency(overview.lifetimeEarnings), trend: overview.trends.lifetime },
    { label: 'This Week', value: formatCurrency(overview.thisWeekEarnings), trend: overview.trends.week },
    { label: 'This Month', value: formatCurrency(overview.thisMonthEarnings), trend: overview.trends.month },
    { label: 'Active Investors', value: String(overview.activeInvestors), trend: overview.trends.newInvestors },
    { label: 'Total Referrals', value: String(overview.totalReferrals) },
    {
      label: 'Current Rank',
      value: overview.rank.current,
      sub: `${overview.rank.nextThreshold}+ active for ${overview.rank.next}`,
      icon: Crown,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-gray-500">Build Your Network. Grow Your Wealth.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <HelpCircle className="h-4 w-4" />
            How It Works
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <BookOpen className="h-4 w-4" />
            Referral Rules
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-gray-200 xl:flex-row xl:divide-x xl:divide-y-0">
          {BENEFIT_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="flex min-w-0 flex-1 flex-col p-5">
                <div
                  className={cn(
                    'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
                    card.accent
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {card.lead}
                  <span className="font-semibold text-gray-900">{card.highlight}</span>
                </p>
                <p className="mt-2 text-xs text-gray-400">{card.footer}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metricCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-medium text-gray-500">{stat.label}</p>
                <div className="mt-2 flex items-center gap-2">
                  {Icon ? <Icon className="h-5 w-5 shrink-0 text-violet-600" /> : null}
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
                {stat.trend ? (
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">{stat.trend}</p>
                ) : null}
                {stat.sub ? <p className="mt-1 text-[10px] text-gray-400">{stat.sub}</p> : null}
              </div>
            )
          })}
        </div>
        <ReferralHealthScoreGauge score={overview.healthScore} label={overview.healthLabel} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <ReferralRankProgressPanel rank={overview.rank} />

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-gray-900">Earnings Overview</h3>
                <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
                  {(['30', '90', '365'] as const).map((period) => (
                    <button
                      key={period}
                      type="button"
                      onClick={() => setChartPeriod(period)}
                      className={cn(
                        'rounded-md px-2.5 py-1 font-medium',
                        chartPeriod === period
                          ? 'bg-[#0052ff] text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {period} Days
                    </button>
                  ))}
                </div>
              </div>
              {chartsReady ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="referralEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0052ff" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#0052ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...chartGridStyle} />
                    <XAxis dataKey="month" {...chartAxisStyle} dy={8} />
                    <YAxis {...chartAxisStyle} width={48} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      {...chartTooltipWrapperProps}
                      cursor={chartTooltipCursor}
                      content={
                        <ChartTooltipContent
                          valueFormatter={(value) => formatChartCurrency(value)}
                          labelFormatter={(label) => String(label)}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      name="Earnings"
                      stroke="#0052ff"
                      strokeWidth={2.5}
                      fill="url(#referralEarnings)"
                      dot={false}
                      activeDot={areaChartActiveDot}
                    />
                    <Area
                      type="monotone"
                      dataKey="potential"
                      name="Potential"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="none"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] animate-pulse rounded-lg bg-gray-100" />
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Earnings Breakdown</h3>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="shrink-0">
                  {chartsReady ? (
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={overview.earningsBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {overview.earningsBreakdown.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip {...chartTooltipWrapperProps} content={<PieTooltipContent valueSuffix="%" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] w-[200px] animate-pulse rounded-full bg-gray-100" />
                  )}
                </div>
                <div className="flex w-full flex-1 flex-col justify-center gap-4 sm:pl-2">
                  {overview.earningsBreakdown.map((item) => (
                    <div key={item.name} className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-start gap-2 text-gray-700">
                        <span
                          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <span className="block truncate">{item.name}</span>
                          <span className="mt-0.5 block text-xs font-bold text-gray-900">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 font-semibold text-gray-900">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div className="h-full lg:col-span-2">
              <ReferralNetworkPanel levels={overview.networkLevels} />
            </div>
            <ReferralChannelsPanel channels={overview.channels} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
              <h3 className="font-semibold text-gray-900">Recent Activities</h3>
              <div className="mt-4 space-y-3">
                {overview.recentActivities.length > 0 ? (
                  overview.recentActivities.map((activity) => (
                    <div key={activity.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-600">{activity.amount}</span>
                        <span className="text-gray-400">{activity.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No activity yet"
                    description="Share your link to start earning referral commissions."
                    compact
                    className="border-0 bg-transparent"
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Achievements & Badges</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {overview.achievements.map((badge) => (
                  <div
                    key={badge.id}
                    className={cn(
                      'flex flex-col items-center rounded-xl border px-3 py-4 text-center',
                      badge.unlocked
                        ? 'border-violet-200 bg-violet-50'
                        : 'border-gray-100 bg-gray-50 opacity-60'
                    )}
                  >
                    <Award className={cn('h-6 w-6', badge.unlocked ? 'text-violet-600' : 'text-gray-400')} />
                    <p className="mt-2 text-[11px] font-semibold text-gray-800">{badge.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Active Challenges</h3>
              <div className="mt-4 space-y-4">
                {overview.challenges.map((challenge) => (
                  <div key={challenge.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{challenge.title}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {challenge.progress}/{challenge.target} completed
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {challenge.reward}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-[#0052ff]"
                        style={{
                          width: `${Math.min(100, (challenge.progress / challenge.target) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
            <div
              id="all-referrals"
              className="scroll-mt-24 rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2"
            >
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h3 className="font-semibold text-gray-900">All Referrals</h3>
              <Link href="/transactions" className="text-sm font-semibold text-[#0052ff] hover:underline">
                View transactions
              </Link>
            </div>
            <div className="overflow-x-auto p-6">
              {referrals.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No referrals yet"
                  description="Share your referral link to invite friends and start earning commissions."
                  action={
                    <button
                      type="button"
                      onClick={copyLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      <Copy className="h-4 w-4" />
                      Copy referral link
                    </button>
                  }
                  compact
                />
              ) : (
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase text-gray-500">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Joined</th>
                      <th className="pb-3 text-right">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {referrals.map((referral) => (
                      <tr key={referral.id}>
                        <td className="py-4">
                          <p className="font-medium text-gray-900">{referral.name}</p>
                          <p className="text-xs text-gray-500">{referral.email}</p>
                        </td>
                        <td className="py-4">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-semibold',
                              referral.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : referral.status === 'Pending'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                            )}
                          >
                            {referral.status}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-gray-500">{referral.joinedDate}</td>
                        <td className="py-4 text-right font-semibold text-emerald-600">
                          {formatCurrency(referral.commissionEarned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            </div>
            <ReferralFunnelPanel funnel={overview.funnel} />
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Your Referral Link</h3>
            <AsyncState
              loading={loading && !referralData}
              error={error}
              onRetry={reload}
              compact
              skeleton={<div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />}
            >
              <div className="mt-3 flex gap-2">
                <input
                  readOnly
                  value={referralData.referralLink}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#0052ff] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
              </div>
            </AsyncState>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {SHARE_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleShare(action.key)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 px-2 py-2.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Icon className={cn('h-4 w-4', action.color)} />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
            <h3 className="font-semibold text-gray-900">Referral QR Code</h3>
            <div className="mt-4">
              <ReferralQrCode value={referralData.referralLink} />
            </div>
            {referralData.referralCode ? (
              <p className="mt-2 text-xs text-gray-500">
                Code: <span className="font-semibold text-gray-800">{referralData.referralCode}</span>
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Top Referrers This Month</h3>
              <Crown className="h-4 w-4 text-amber-500" />
            </div>
            {overview.leaderboard.length > 0 ? (
              <ul className="space-y-3">
                {overview.leaderboard.map((entry) => (
                  <li key={entry.rank} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                        {entry.rank}
                      </span>
                      <span className="font-medium text-gray-900">{entry.name}</span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {formatCurrency(entry.earnings)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                icon={Trophy}
                title="No leaderboard data yet"
                description="Refer friends to climb the rankings."
                compact
                className="border-0 bg-transparent"
              />
            )}
            <button
              type="button"
              className="mt-4 inline-flex w-full items-center justify-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              View Full Leaderboard
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 text-violet-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">Referral rank rewards</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Bronze ($150) through Ambassador (company car, AcademyFx office, $1,000/mo salary,
                  0.5% team profits weekly) based on active members.
                </p>
                <Link
                  href="/support"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
                >
                  View program terms
                  <Target className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
