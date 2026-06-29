'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  BookOpen,
  ChevronRight,
  Copy,
  Crown,
  Gift,
  HelpCircle,
  Mail,
  MessageCircle,
  Share2,
  Shield,
  Target,
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
import { fetchReferralProgramOverview } from '@/lib/data/queries'
import { formatCurrency } from '@/lib/data/format'
import { ensureMyReferralCode } from '@/lib/referral/actions'
import { cn } from '@/lib/utils'

const BENEFIT_CARDS = [
  {
    title: 'Welcome Bonus',
    description: 'You & your friend get $10 investment credit after first deposit & KYC.',
    icon: Gift,
    accent: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Investment Commission',
    description: 'Earn 2% on every deposit. One-time commission.',
    icon: Trophy,
    accent: 'bg-blue-50 text-[#0052ff]',
  },
  {
    title: 'Weekly Profit Share',
    description: 'Earn up to 5% weekly. Lifetime earnings from your network.',
    icon: Share2,
    accent: 'bg-violet-50 text-violet-600',
  },
  {
    title: '3 Levels Deep',
    description: 'Level 1: 5% · Level 2: 2% · Level 3: 1%. Unlimited generations.',
    icon: Users,
    accent: 'bg-amber-50 text-amber-600',
  },
]

const SHARE_ACTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', icon: Zap, color: 'text-[#0052ff]' },
  { key: 'facebook', label: 'Facebook', icon: Share2, color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-gray-600' },
  { key: 'sms', label: 'SMS', icon: MessageCircle, color: 'text-violet-600' },
  { key: 'copy', label: 'Copy', icon: Copy, color: 'text-gray-700' },
] as const

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

export function ReferralProgramView() {
  const { data, loading, error, reload } = useAsyncData(() => fetchReferralProgramOverview(), [])
  const [chartPeriod, setChartPeriod] = useState<'30' | '90' | '365'>('30')
  const [chartsReady, setChartsReady] = useState(false)

  useEffect(() => {
    setChartsReady(true)
  }, [])

  useEffect(() => {
    void ensureMyReferralCode().then((code) => {
      if (code) reload()
    })
  }, [reload])

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

  const statCards = [
    { label: 'Lifetime Earnings', value: formatCurrency(overview.lifetimeEarnings), trend: overview.trends.lifetime },
    { label: 'This Week', value: formatCurrency(overview.thisWeekEarnings), trend: overview.trends.week },
    { label: 'This Month', value: formatCurrency(overview.thisMonthEarnings), trend: overview.trends.month },
    { label: 'Active Investors', value: String(overview.activeInvestors), trend: overview.trends.newInvestors },
    { label: 'Total Referrals', value: String(overview.totalReferrals) },
    { label: 'Current Rank', value: overview.rank.current, sub: `${overview.rank.nextThreshold}+ active for ${overview.rank.next}` },
    { label: 'Health Score', value: `${overview.healthScore}/100`, sub: overview.healthLabel },
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {BENEFIT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', card.accent)}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.description}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-medium text-gray-500">{stat.label}</p>
            <p className="mt-2 text-lg font-bold text-gray-900">{stat.value}</p>
            {stat.trend ? (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600">{stat.trend}</p>
            ) : null}
            {stat.sub ? <p className="mt-1 text-[10px] text-gray-400">{stat.sub}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">Rank progress</p>
                <p className="text-xl font-bold text-gray-900">
                  {overview.rank.current}{' '}
                  <span className="font-medium text-gray-400">→</span> {overview.rank.next}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Progress to {overview.rank.next}: {overview.rank.nextThreshold} active investors
                </p>
              </div>
              <p className="text-sm font-semibold text-[#0052ff]">
                {overview.rank.activeInvestors}/{overview.rank.nextThreshold}
              </p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0052ff] to-violet-500"
                style={{ width: `${overview.rank.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
              <h3 className="mb-2 font-semibold text-gray-900">Earnings Breakdown</h3>
              {chartsReady ? (
                <ResponsiveContainer width="100%" height={220}>
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
                <div className="mx-auto h-[220px] w-[220px] animate-pulse rounded-full bg-gray-100" />
              )}
              <div className="mt-2 grid grid-cols-2 gap-2">
                {overview.earningsBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name} ({item.value}%)
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
              <h3 className="font-semibold text-gray-900">My Referral Network</h3>
              <div className="mt-4 space-y-4">
                {overview.networkLevels.map((level) => (
                  <div key={level.level} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-900">{level.level}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(level.earnings)} earned</p>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-[#0052ff]">{level.count}</p>
                    <div className="mt-3 flex -space-x-2">
                      {level.members.length > 0 ? (
                        level.members.map((member) => (
                          <span
                            key={member.id}
                            title={member.name}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0052ff] text-[10px] font-bold text-white"
                          >
                            {member.initials}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No members yet</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Top Performing Channels</h3>
              <div className="mt-4 space-y-3">
                {overview.channels.map((channel) => (
                  <div key={channel.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{channel.name}</span>
                      <span className="text-gray-500">{channel.percent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900">Conversion Funnel</h3>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Clicks', value: overview.funnel.clicks, width: '100%' },
                  { label: 'Signups', value: overview.funnel.signups, width: '72%' },
                  {
                    label: 'Active Investors',
                    value: overview.funnel.activeInvestors,
                    width: '48%',
                  },
                ].map((step) => (
                  <div key={step.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700">{step.label}</span>
                      <span className="font-semibold text-gray-900">{step.value.toLocaleString()}</span>
                    </div>
                    <div className="h-8 overflow-hidden rounded-lg bg-gray-100">
                      <div
                        className="flex h-full items-center rounded-lg bg-gradient-to-r from-[#0052ff] to-violet-500 px-3 text-[10px] font-semibold text-white"
                        style={{ width: step.width }}
                      >
                        {step.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-sm font-semibold text-emerald-600">
                Conversion Rate: {overview.funnel.conversionRate}%
              </p>
            </div>
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

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
                <p className="text-sm font-semibold text-gray-900">PrimeFx Ambassador</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  Unlock unlimited earning potential with higher ranks and exclusive bonuses.
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0052ff] hover:underline"
                >
                  Apply Now
                  <Target className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
