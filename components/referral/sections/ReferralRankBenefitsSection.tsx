'use client'

import { memo } from 'react'
import { Check, Crown, Rocket } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ReferralPageHeader } from '@/components/referral/shared/ReferralPageHeader'
import {
  ReferralRankShield,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { sectionStackClass } from '@/lib/layout/spacing'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'
import {
  REFERRAL_RANK_BENEFIT_COLUMNS,
  REFERRAL_RANK_BENEFIT_ROWS,
} from '@/lib/referral/rank-benefits-ui'
import { referralSectionHref } from '@/lib/referral/navigation'
import { cn } from '@/lib/utils'

type ReferralRankBenefitsSectionProps = {
  overview: ReferralProgramOverview
}

function BenefitCell({ value }: { value: string | boolean | undefined }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-emerald-600" aria-label="Included" />
  }
  if (value === false || value === undefined || value === '—') {
    return <span className="text-muted-foreground">—</span>
  }
  return <span className="text-xs font-medium text-foreground sm:text-sm">{value}</span>
}

function ReferralRankBenefitsSectionInner({ overview }: ReferralRankBenefitsSectionProps) {
  const { rank } = overview

  return (
    <div className={cn('min-w-0', sectionStackClass)}>
      <ReferralPageHeader
        icon={<Crown className="h-5 w-5 text-violet-600" aria-hidden />}
        title="Rank Benefits"
        subtitle="Climb higher, unlock more, and enjoy premium rewards."
        action={
          <Link
            href={referralSectionHref('rank')}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            How Rank System Works
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-6">
          <div className={cardSurfaceClass}>
            <div className="flex flex-wrap items-end justify-between gap-4 overflow-x-auto pb-2">
              {REFERRAL_RANK_BENEFIT_COLUMNS.map((col) => (
                <div key={col.key} className="flex min-w-[72px] flex-col items-center gap-2 text-center">
                  <ReferralRankShield
                    rankName={col.label}
                    size="sm"
                    className={col.key === resolveCurrentKey(rank.current) ? 'ring-2 ring-primary' : undefined}
                  />
                  <p className="text-xs font-semibold text-foreground">{col.label}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {col.minMembers.toLocaleString()} investors
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(cardSurfaceClass, 'overflow-x-auto')}>
            <h2 className="font-semibold text-foreground">Compare All Rank Benefits</h2>
            <table className="mt-4 w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Benefit
                  </th>
                  {REFERRAL_RANK_BENEFIT_COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      className="pb-3 px-2 text-center text-xs font-semibold text-foreground"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {REFERRAL_RANK_BENEFIT_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="py-3 pr-4 font-medium text-foreground">{row.label}</td>
                    {REFERRAL_RANK_BENEFIT_COLUMNS.map((col) => (
                      <td key={col.key} className="py-3 px-2 text-center">
                        <BenefitCell value={row.values[col.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  The Higher You Climb, The More You Earn!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each rank brings bigger rewards, more profit share, and exclusive lifestyle
                  benefits.
                </p>
              </div>
              <Link
                href={referralSectionHref('network')}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-600 px-5 text-sm font-semibold text-white"
              >
                <Rocket className="h-4 w-4" />
                Start Building Your Empire
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className={cardSurfaceClass}>
            <div className="flex items-center gap-3">
              <ReferralRankShield rankName={rank.current} size="sm" />
              <div>
                <p className="text-xs text-muted-foreground">Your Current Rank</p>
                <p className="text-lg font-bold">{shortRankName(rank.current)}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  Progress to {shortRankName(rank.next)}
                </span>
                <span className="font-semibold">{rank.progressPercent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-violet-100">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${rank.progressPercent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Active Investors: {rank.activeInvestors} / {rank.nextThreshold}
              </p>
            </div>
            <Link
              href={referralSectionHref('rank')}
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold hover:bg-muted"
            >
              View My Rank Progress →
            </Link>
          </div>

          <div className={cardSurfaceClass}>
            <h3 className="font-semibold text-foreground">Exclusive Highlights</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Higher weekly profit share at every rank</li>
              <li>One-time rank bonuses up to $2,000</li>
              <li>Premium support and analytics tools</li>
              <li>Global recognition at Ambassador level</li>
            </ul>
          </div>

          {!rank.current.includes(rank.next) ? (
            <div className={cardSurfaceClass}>
              <ReferralRankShield rankName={rank.next} size="sm" />
              <p className="mt-3 font-bold text-foreground">{shortRankName(rank.next)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {rank.nextThreshold.toLocaleString()} Active Investors required
              </p>
              <Link
                href={referralSectionHref('benefits')}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold"
              >
                View {shortRankName(rank.next)} Benefits
              </Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function resolveCurrentKey(rankName: string) {
  const col = REFERRAL_RANK_BENEFIT_COLUMNS.find(
    (c) => c.label.toLowerCase() === shortRankName(rankName).toLowerCase()
  )
  return col?.key
}

export const ReferralRankBenefitsSection = memo(ReferralRankBenefitsSectionInner)
