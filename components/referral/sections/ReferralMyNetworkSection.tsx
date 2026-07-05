'use client'

import { memo, useState } from 'react'
import { Copy, Network, Share2, TrendingUp, Users, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import { ReferralRankPill, ReferralRankShield } from '@/components/referral/shared/referral-rank-ui'
import { KpiCard, KpiGrid } from '@/components/shared/kpi'
import { EmptyState } from '@/components/shared/data-state'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import { formatCurrency } from '@/lib/data/format'
import type { ReferralListItem, ReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralData } from '@/lib/data/types'
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

function ReferralMyNetworkSectionInner({
  overview,
  referrals,
  referralData,
}: ReferralMyNetworkSectionProps) {
  const [genFilter, setGenFilter] = useState<string>('all')

  const filteredReferrals = referrals.filter((row) => {
    if (genFilter === 'all') return true
    if (genFilter === '5') return (row.networkLevel ?? 1) >= 5
    return String(row.networkLevel ?? 1) === genFilter
  })

  const directReferrals = referrals.filter((r) => (r.networkLevel ?? 1) === 1).slice(0, 5)

  const copyLink = async () => {
    if (!referralData.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
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
              onClick={copyLink}
              className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Export Network
            </button>
            <button
              type="button"
              onClick={copyLink}
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
          value={formatCurrency(overview.activeInvestors * 675)}
          trend="+22.4%"
          icon={<Wallet className="h-4 w-4 sm:h-5 sm:w-5" />}
          iconBg="bg-blue-50 text-primary"
        />
        <KpiCard
          label="Team Profit Generated"
          value={formatCurrency(overview.lifetimeEarnings * 50)}
          trend="+19.7%"
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
                    <p className="font-bold">{formatCurrency(overview.activeInvestors * 675)}</p>
                  </div>
                </div>
              </div>

              {directReferrals.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {directReferrals.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Gen {member.networkLevel ?? 1}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Volume</p>
                          <p className="font-semibold">{member.tradingVolume}</p>
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
                  compact
                />
              )}
            </div>
          </div>

          {filteredReferrals.length > 0 ? (
            <div className={cardSurfaceClass}>
              <h3 className="font-semibold text-foreground">Network Members</h3>
              <ul className="mt-3 divide-y divide-border">
                {filteredReferrals.slice(0, 10).map((member) => (
                  <li key={member.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Gen {member.networkLevel ?? 1} · {member.status}
                      </p>
                    </div>
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
              <p>Active: {overview.healthScore}%</p>
              <p>Inactive: {Math.max(0, 100 - overview.healthScore - 2)}%</p>
            </div>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Top Performers</h3>
            <ol className="mt-3 space-y-2">
              {overview.leaderboard.slice(0, 5).map((entry) => (
                <li key={entry.rank} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {entry.rank}. {entry.name}
                  </span>
                  <span className="text-emerald-600">{formatCurrency(entry.earnings)}</span>
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
