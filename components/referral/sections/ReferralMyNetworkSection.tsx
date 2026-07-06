'use client'

import { memo, useMemo, useState } from 'react'
import { Copy, Network, Share2, TrendingUp, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import { ReferralMemberIdentity } from '@/components/referral/shared/ReferralMemberIdentity'
import { ReferralRankPill } from '@/components/referral/shared/referral-rank-ui'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { EmptyState } from '@/components/shared/data-state'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralListItem, ReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralData } from '@/lib/data/types'
import { downloadReferralNetworkCsv } from '@/lib/referral/export-network'
import { buildReferralShareUrl, copyReferralText, shareReferralLink } from '@/lib/referral/share'
import { cn } from '@/lib/utils'

type ReferralMyNetworkSectionProps = {
  overview: ReferralProgramOverview
  referrals: ReferralListItem[]
  referralData: ReferralData
}

const GENERATION_TABS = [
  { key: 'all', label: 'All' },
  { key: '1', label: 'Gen 1' },
  { key: '2', label: 'Gen 2' },
  { key: '3', label: 'Gen 3' },
  { key: '4', label: 'Gen 4' },
  { key: '5', label: 'Gen 5+' },
] as const

const QUICK_SHARE = [
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'twitter', label: 'X' },
  { key: 'facebook', label: 'Facebook' },
] as const

function ReferralMyNetworkSectionInner({
  overview,
  referrals,
  referralData,
}: ReferralMyNetworkSectionProps) {
  const [genFilter, setGenFilter] = useState<string>('all')

  const filteredReferrals = useMemo(
    () =>
      referrals.filter((row) => {
        if (genFilter === 'all') return true
        if (genFilter === '5') return (row.networkLevel ?? 1) >= 5
        return String(row.networkLevel ?? 1) === genFilter
      }),
    [genFilter, referrals]
  )

  const directReferrals = useMemo(
    () => referrals.filter((r) => (r.networkLevel ?? 1) === 1).slice(0, 6),
    [referrals]
  )

  const copyLink = async () => {
    if (!referralData.referralLink) return
    const ok = await copyReferralText(referralData.referralLink)
    if (ok) toast.success('Referral link copied')
    else toast.error('Failed to copy link')
  }

  const shareNative = async () => {
    if (!referralData.referralLink) return
    const shared = await shareReferralLink(referralData.referralLink)
    if (!shared) await copyLink()
  }

  const exportNetwork = () => {
    if (!referrals.length) {
      toast.error('No network members to export yet')
      return
    }
    downloadReferralNetworkCsv(referrals)
    toast.success('Network exported')
  }

  const genCounts = GENERATION_TABS.map((tab) => {
    if (tab.key === 'all') return { ...tab, count: referrals.length }
    if (tab.key === '5') {
      return { ...tab, count: referrals.filter((r) => (r.networkLevel ?? 1) >= 5).length }
    }
    return {
      ...tab,
      count: referrals.filter((r) => (r.networkLevel ?? 1) === Number(tab.key)).length,
    }
  })

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<Network className="h-5 w-5" aria-hidden />}
        title="My Network"
        subtitle="Visualize your referral tree, track team performance, and grow your empire."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportNetwork}
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Export Network
            </button>
            <button
              type="button"
              onClick={shareNative}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:opacity-95"
            >
              <Share2 className="h-4 w-4" />
              Invite & Earn
            </button>
          </div>
        }
      />

      <KpiGrid count={4} aria-label="Network metrics">
        <KpiCard
          label="Total Active Investors"
          value={overview.activeInvestors.toLocaleString()}
          trend={overview.trends.newInvestors}
          icon={<Users className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-violet-50 text-violet-600"
        />
        <KpiCard
          label="Team Volume"
          value={formatCurrency(overview.teamVolumeUsd)}
          trend={overview.trends.teamVolume}
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-primary"
        />
        <KpiCard
          label="Team Profit Generated"
          value={formatCurrency(overview.teamProfitUsd)}
          trend={overview.trends.teamProfit}
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KpiCard
          label="You Earn (This Week)"
          value={formatCurrency(overview.thisWeekEarnings)}
          trend={overview.trends.week}
          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-orange-50 text-orange-600"
        />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className={cardSurfaceClass}>
            <div className="flex flex-wrap gap-2">
              {genCounts.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGenFilter(tab.key)}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-semibold sm:text-sm',
                    genFilter === tab.key
                      ? 'bg-orange-500 text-white'
                      : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  {tab.label}
                  <span className="opacity-80">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold">
                    You
                  </div>
                  <div>
                    <p className="font-semibold">Your Network Root</p>
                    <ReferralRankPill rankName={overview.rank.current} />
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-slate-400">Active Investors</p>
                    <p className="font-bold">{overview.activeInvestors}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Team Volume</p>
                    <p className="font-bold">{formatCurrency(overview.teamVolumeUsd)}</p>
                  </div>
                </div>
              </div>

              {directReferrals.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {directReferrals.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <ReferralMemberIdentity
                        name={member.name}
                        username={member.username}
                        country={member.country}
                        verified={member.verified}
                        avatarUrl={member.avatarUrl}
                        seed={member.userId}
                        subtitle={`Gen ${member.networkLevel ?? 1}`}
                      />
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <ReferralRankPill rankName={member.rankName} />
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          {member.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-semibold">{member.tradingVolume}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Plan</p>
                          <p className="font-semibold">{member.investmentPlan ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Earned</p>
                          <p className="font-semibold text-emerald-600">
                            {formatCurrency(member.commissionEarned)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No network members yet"
                  description="Share your referral link to start building your network."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={copyLink}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white"
                      >
                        <Copy className="h-4 w-4" />
                        Copy Referral Link
                      </button>
                      {QUICK_SHARE.map((channel) => (
                        <button
                          key={channel.key}
                          type="button"
                          onClick={() => {
                            if (!referralData.referralLink) return
                            window.open(
                              buildReferralShareUrl(channel.key, referralData.referralLink),
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }}
                          className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-sm font-semibold hover:bg-muted"
                        >
                          {channel.label}
                        </button>
                      ))}
                    </div>
                  }
                  compact
                />
              )}
            </div>
          </div>

          {filteredReferrals.length > 0 ? (
            <div className={cardSurfaceClass}>
              <h3 className="font-semibold text-foreground">Network Members</h3>
              <ul className="mt-3 divide-y divide-border">
                {filteredReferrals.slice(0, 20).map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                    <ReferralMemberIdentity
                      name={member.name}
                      username={member.username}
                      country={member.country}
                      verified={member.verified}
                      avatarUrl={member.avatarUrl}
                      seed={member.userId}
                      subtitle={`Gen ${member.networkLevel ?? 1} · ${member.status}`}
                      size="sm"
                    />
                    <p className="shrink-0 text-sm font-semibold text-emerald-600">
                      {formatCurrency(member.commissionEarned)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Network Health</h3>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{overview.healthScore}%</p>
            <p className="text-sm font-medium text-emerald-600">{overview.healthLabel}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>Active: {overview.networkHealth.activePercent}%</p>
              <p>Inactive: {overview.networkHealth.inactivePercent}%</p>
              {overview.networkHealth.suspendedPercent > 0 ? (
                <p>Suspended: {overview.networkHealth.suspendedPercent}%</p>
              ) : null}
            </div>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Top Performers</h3>
            <ol className="mt-3 space-y-3">
              {overview.leaderboard.slice(0, 5).map((entry) => (
                <li key={entry.rank} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="w-4 shrink-0 font-semibold text-muted-foreground">{entry.rank}.</span>
                    <ReferralMemberIdentity
                      name={entry.name}
                      country={entry.country}
                      verified={entry.verified}
                      avatarUrl={entry.avatarUrl}
                      seed={entry.userId}
                      size="sm"
                    />
                  </div>
                  <span className="shrink-0 text-emerald-600">{formatCurrency(entry.earnings)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Invite & Grow</h3>
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <input
                readOnly
                value={referralData.referralLink}
                className="min-w-0 flex-1 truncate bg-transparent text-xs text-muted-foreground"
                aria-label="Referral link"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
                aria-label="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export const ReferralMyNetworkSection = memo(ReferralMyNetworkSectionInner)
