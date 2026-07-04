'use client'

import { Award, Crown, Shield } from 'lucide-react'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { REFERRAL_TRUST_CARDS } from '@/lib/referral/display-config'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

export function ReferralRankProgressCard({ rank }: { rank: ReferralProgramOverview['rank'] }) {
  const isMaxRank = rank.current === rank.next
  const currentShort = shortRankName(rank.current)
  const nextShort = shortRankName(rank.next)

  return (
    <section aria-label="Rank progression" className="space-y-4">
      <SectionHeading>Rank progression</SectionHeading>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)] lg:items-stretch">
          <div className="flex items-center gap-4 border-b border-border px-5 py-5 lg:border-b-0 lg:border-r">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <Crown className="h-6 w-6 text-violet-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Current Rank</p>
              <p className="text-xl font-bold text-foreground">{currentShort}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Keep growing your active network</p>
            </div>
          </div>

          <div className="flex flex-col justify-center border-b border-border px-5 py-5 lg:border-b-0 lg:border-r lg:px-8">
            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{isMaxRank ? 'Maximum rank achieved' : `Progress to ${nextShort}`}</span>
              <span className="tabular-nums font-semibold text-foreground">
                {rank.activeInvestors.toLocaleString()}
                <span className="font-normal text-muted-foreground">
                  {' '}
                  / {rank.nextThreshold.toLocaleString()}
                </span>
              </span>
            </div>
            <div
              className="mt-3 h-3 overflow-hidden rounded-full bg-violet-100"
              role="progressbar"
              aria-valuenow={rank.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-primary transition-all duration-700"
                style={{
                  width: `${Math.max(rank.progressPercent, rank.progressPercent > 0 ? 4 : 0)}%`,
                }}
              />
            </div>
            {!isMaxRank && rank.membersRemaining > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {rank.membersRemaining.toLocaleString()} more active member
                {rank.membersRemaining === 1 ? '' : 's'} to reach {nextShort} rank
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-4 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Award className="h-6 w-6 text-amber-600" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Next Reward</p>
              <p className="text-lg font-bold text-primary">
                {isMaxRank ? 'Top tier unlocked' : `${nextShort} Badge`}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isMaxRank ? 'All ranks achieved' : `${rank.nextThreshold} active referrals required`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ReferralTrustSection() {
  return (
    <section aria-label="Program trust" className="space-y-4">
      <SectionHeading>Why investors trust our referral program</SectionHeading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REFERRAL_TRUST_CARDS.map((card) => (
          <article
            key={card.title}
            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <h3 className="font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
