'use client'

import { memo } from 'react'
import { Check, Lock } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  ReferralRankShield,
  resolveRankKeyFromName,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import { REFERRAL_RANK_TIERS } from '@/lib/referral/program-config'
import { referralSectionHref } from '@/lib/referral/navigation'
import { cn } from '@/lib/utils'

export const RANK_EMOJI: Record<string, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
  ambassador: '🏆',
  none: '◆',
}

type ReferralRankProgressBannerProps = {
  currentRank: string
  nextRank: string
  progressPercent: number
}

function ReferralRankProgressBannerInner({
  currentRank,
  nextRank,
  progressPercent,
}: ReferralRankProgressBannerProps) {
  const currentKey = resolveRankKeyFromName(currentRank)
  const currentIdx = REFERRAL_RANK_TIERS.findIndex((t) => t.key === currentKey)
  const awayPercent = Math.max(0, 100 - progressPercent)

  return (
    <section
      aria-label="Your rank progress"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-4 shadow-xl sm:p-5 lg:p-6"
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#7c3aed]/20 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-6">
        <div className="flex items-center gap-4">
          <ReferralRankShield
            rankName={currentRank}
            size="lg"
            className="relative ring-2 ring-white/20 transition-transform hover:scale-105"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Current Rank
            </p>
            <p className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              <span aria-hidden>{RANK_EMOJI[currentKey] ?? '◆'}</span>
              {shortRankName(currentRank)}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-400">
              Top {Math.max(5, 100 - progressPercent)}%
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="hidden items-center justify-between gap-1 md:flex">
            {REFERRAL_RANK_TIERS.map((tier, idx) => {
              const status =
                idx < currentIdx ? 'done' : idx === currentIdx ? 'current' : 'locked'
              return (
                <div key={tier.key} className="flex min-w-0 flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                        status === 'done' && 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40',
                        status === 'current' &&
                          'bg-orange-500/20 text-orange-300 ring-2 ring-orange-400 shadow-[0_0_12px_rgba(249,115,22,0.45)]',
                        status === 'locked' && 'bg-slate-700/50 text-slate-500'
                      )}
                    >
                      {status === 'done' ? (
                        <Check className="h-4 w-4" aria-hidden />
                      ) : status === 'locked' ? (
                        <Lock className="h-3 w-3" aria-hidden />
                      ) : (
                        <span aria-hidden>{RANK_EMOJI[tier.key]}</span>
                      )}
                    </div>
                    {idx < REFERRAL_RANK_TIERS.length - 1 ? (
                      <div
                        className={cn(
                          'mx-0.5 h-0.5 min-w-[0.5rem] flex-1',
                          idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-700'
                        )}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <p className="mt-1.5 truncate text-[10px] font-semibold text-slate-300">
                    {shortRankName(tier.name)}
                  </p>
                  <p
                    className={cn(
                      'text-[9px] font-bold uppercase',
                      status === 'done' && 'text-emerald-400',
                      status === 'current' && 'text-orange-400',
                      status === 'locked' && 'text-slate-500'
                    )}
                  >
                    {status === 'done' ? 'Completed' : status === 'current' ? 'In Progress' : 'Locked'}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-4 md:mt-5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Progress to {shortRankName(nextRank)}</span>
              <span className="font-bold text-white">{progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f97316] via-[#7c3aed] to-primary transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              You&apos;re {awayPercent}% away from {shortRankName(nextRank)}
            </p>
          </div>
        </div>

        <Link
          href={referralSectionHref('benefits')}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white hover:bg-white/10 lg:self-center"
        >
          View Rank Benefits
        </Link>
      </div>
    </section>
  )
}

export const ReferralRankProgressBanner = memo(ReferralRankProgressBannerInner)
