'use client'

import { useEffect, useMemo } from 'react'
import {
  Copy,
  Gift,
  Link2,
  Mail,
  MessageCircle,
  Share2,
  Trophy,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState, EmptyState, ErrorState } from '@/components/shared/data-state'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
import { MetricCardsSkeleton, PageHeaderSkeleton, TableSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchReferralData, fetchReferralList } from '@/lib/data/queries'
import { ensureMyReferralCode } from '@/lib/referral/actions'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

const BENEFIT_CARDS = [
  {
    title: 'Welcome Bonus',
    description: '$10 investment credit for you and your friend after first deposit & KYC.',
    icon: Gift,
  },
  {
    title: 'Investment Commission',
    description: 'Earn 2% one-time commission on every referred deposit.',
    icon: Trophy,
  },
  {
    title: 'Weekly Profit Share',
    description: 'Earn up to 5% weekly lifetime earnings from your network.',
    icon: Share2,
  },
  {
    title: '3 Levels Deep',
    description: 'Level 1: 5% · Level 2: 2% · Level 3: 1%',
    icon: Users,
  },
]

const SHARE_CHANNELS = [
  { label: 'WhatsApp', icon: MessageCircle },
  { label: 'Telegram', icon: SendIcon },
  { label: 'Facebook', icon: Share2 },
  { label: 'Email', icon: Mail },
  { label: 'Copy Link', icon: Link2 },
]

function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  )
}

export function ReferralProgramView() {
  const { data: referralData, loading: dataLoading, error: dataError, reload: reloadData } =
    useAsyncData(() => fetchReferralData(), [])
  const { data: referrals = [], loading: listLoading, error: listError, reload: reloadList } =
    useAsyncData(() => fetchReferralList(), [])

  useEffect(() => {
    void ensureMyReferralCode().then((code) => {
      if (code) reloadData()
    })
  }, [reloadData])

  const loading = dataLoading || listLoading
  const error = dataError ?? listError
  const activeCount = referrals.filter((r) => r.status === 'Active').length
  const totalEarned = referrals.reduce((sum, r) => sum + r.commissionEarned, 0)

  const leaderboard = useMemo(
    () =>
      [...referrals]
        .sort((a, b) => b.commissionEarned - a.commissionEarned)
        .slice(0, 5),
    [referrals]
  )

  const copyLink = async () => {
    if (!referralData?.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const reloadAll = () => {
    reloadData()
    reloadList()
  }

  if (loading && !referralData && referrals.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeaderSkeleton />
        <MetricCardsSkeleton count={4} />
        <TableSkeleton rows={4} cols={4} />
      </div>
    )
  }

  if (error && !referralData && referrals.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="mt-1 text-gray-500">Build your network. Grow your wealth.</p>
        </div>
        <ErrorState
          title="Could not load referral program"
          description={error}
          onRetry={reloadAll}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Active
            </span>
          </div>
          <p className="mt-1 text-gray-500">Build your network. Grow your wealth.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" className="rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
            How it works
          </button>
          <button type="button" className="rounded-lg border border-gray-200 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
            Referral rules
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BENEFIT_CARDS.map((card) => {
              const Icon = card.icon
              return (
                <div key={card.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{card.description}</p>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { label: 'Lifetime Earnings', value: formatCurrency(totalEarned), trend: '+24.5%' },
              { label: 'This Week', value: formatCurrency(totalEarned * 0.04), trend: '+18.7%' },
              { label: 'This Month', value: formatCurrency(totalEarned * 0.17), trend: '+32.4%' },
              { label: 'Active Investors', value: String(activeCount), trend: `+${Math.max(0, activeCount - 1)} new` },
              { label: 'Total Referrals', value: String(referralData?.totalReferrals ?? 0) },
              { label: 'Current Rank', value: activeCount >= 10 ? 'Diamond' : 'Growth' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{stat.value}</p>
                {stat.trend ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">{stat.trend}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
            <div className="space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rank progress</p>
                    <p className="text-lg font-bold text-gray-900">
                      {activeCount >= 10 ? 'Diamond' : 'Growth'} → Legendary
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    {Math.min(activeCount, 10)}/10 active investors
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#0052ff]"
                    style={{ width: `${Math.min(100, (activeCount / 10) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">My referral network</h3>
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { level: 'Level 1', count: activeCount, earnings: totalEarned * 0.58 },
                    { level: 'Level 2', count: Math.max(0, referrals.length - activeCount), earnings: totalEarned * 0.25 },
                    { level: 'Level 3', count: referrals.length, earnings: totalEarned * 0.1 },
                  ].map((level) => (
                    <div key={level.level} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
                      <p className="text-sm font-semibold text-gray-900">{level.level}</p>
                      <p className="mt-2 text-2xl font-bold text-[#0052ff]">{level.count}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(level.earnings)} earned
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h3 className="font-semibold text-gray-900">Referrals</h3>
                </div>
                <div className="p-6">
                  <AsyncState
                    loading={listLoading && referrals.length === 0}
                    error={listError}
                    onRetry={reloadList}
                    isEmpty={!listLoading && !listError && referrals.length === 0}
                    emptyIcon={Users}
                    emptyTitle="No referrals yet"
                    emptyDescription="Share your referral link to invite friends and start earning commissions."
                    emptyAction={
                      <button
                        type="button"
                        onClick={copyLink}
                        disabled={!referralData?.referralLink}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Copy className="h-4 w-4" />
                        Copy referral link
                      </button>
                    }
                    errorTitle="Could not load referrals"
                    skeleton={<TableSkeleton rows={4} cols={4} />}
                    compact
                  >
                    <div className="overflow-x-auto -mx-6 px-6">
                      <table className="w-full min-w-[560px]">
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
                    </div>
                  </AsyncState>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900">Referral link</h3>
                <AsyncState
                  loading={dataLoading && !referralData}
                  error={dataError}
                  onRetry={reloadData}
                  errorTitle="Could not load referral link"
                  skeleton={
                    <div className="mt-3 h-10 animate-pulse rounded-lg bg-gray-100" />
                  }
                  compact
                >
                  <div className="mt-3 flex gap-2">
                    <input
                      readOnly
                      value={referralData?.referralLink ?? ''}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
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
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Share</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SHARE_CHANNELS.map((channel) => {
                    const Icon = channel.icon
                    return (
                      <button
                        key={channel.label}
                        type="button"
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Icon className="h-4 w-4 text-[#0052ff]" />
                        {channel.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-center">
                <h3 className="mb-3 font-semibold text-gray-900">Scan to join</h3>
                <ReferralQrCode value={referralData?.referralLink ?? ''} />
                {referralData?.referralCode ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Code: <span className="font-semibold text-gray-800">{referralData.referralCode}</span>
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold text-gray-900">Top referrers this month</h3>
                {leaderboard.length === 0 ? (
                  <EmptyState
                    icon={Trophy}
                    title="No leaderboard data yet"
                    description="Refer friends to climb the rankings and earn commissions."
                    compact
                    className="border-0 bg-transparent"
                  />
                ) : (
                  <ul className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">
                            {index + 1}
                          </span>
                          {entry.name}
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {formatCurrency(entry.commissionEarned)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
    </div>
  )
}
