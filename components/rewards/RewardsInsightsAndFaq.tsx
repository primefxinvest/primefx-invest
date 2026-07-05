'use client'

import { memo, useMemo, useState } from 'react'
import { ArrowRight, Bot, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { RewardAchievement } from '@/lib/data/types'
import type { RewardsData } from '@/lib/data/types'
import { REWARDS_FAQ } from '@/lib/rewards/display-config'
import { dashboardCardClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

function RewardsAiInsightsInner({
  achievements,
  rewards,
  referralCount,
  rankProgress,
}: {
  achievements: RewardAchievement[]
  rewards: RewardsData
  referralCount: number
  rankProgress: number
}) {
  const insights = useMemo(() => {
    const list: { id: string; title: string; body: string; prompt: string }[] = []
    const nextAchievement = achievements.find((a) => !a.earned && a.progressMax)

    if (nextAchievement) {
      list.push({
        id: 'next-achievement',
        title: `Fastest unlock: ${nextAchievement.name}`,
        body: `You're ${nextAchievement.progress ?? 0}/${nextAchievement.progressMax} toward +${nextAchievement.points} points.`,
        prompt: `How can I complete the "${nextAchievement.name}" achievement on PrimeFx Invest?`,
      })
    }

    if (rankProgress < 100) {
      list.push({
        id: 'rank',
        title: `Estimated progress to ${rewards.nextTier.replace(' Level', '')}`,
        body: `You're at ${rankProgress}% on your current tier path. Focus on referrals and active investments.`,
        prompt: 'What is the fastest way to reach my next investor rank on PrimeFx?',
      })
    }

    if (referralCount < 10) {
      list.push({
        id: 'referrals',
        title: 'Unlock your first milestone reward',
        body: 'Reach 10 referrals to earn a $50 milestone bonus. Share your link with active investors.',
        prompt: 'How do I grow my PrimeFx referral network to 10 active investors?',
      })
    }

    if (list.length === 0) {
      list.push({
        id: 'optimize',
        title: 'Optimize your rewards strategy',
        body: 'Ask PrimeAI for personalized tips to maximize rank bonuses and achievement points.',
        prompt: 'Analyze my PrimeFx rewards progress and suggest the best next actions.',
      })
    }

    return list.slice(0, 3)
  }, [achievements, rewards, referralCount, rankProgress])

  return (
    <section aria-label="PrimeAI reward insights" className={dashboardCardClass}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Bot className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">PrimeAI Insights</h2>
          <p className="text-xs text-muted-foreground">Personalized reward recommendations</p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-card"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-[#f97316]" aria-hidden />
                  <p className="font-semibold text-foreground">{insight.title}</p>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{insight.body}</p>
              </div>
              <Link
                href={`/primeai?q=${encodeURIComponent(insight.prompt)}`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-95"
              >
                Ask PrimeAI
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export const RewardsAiInsights = memo(RewardsAiInsightsInner)

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold text-foreground"
        aria-expanded={open}
      >
        {q}
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open ? <p className="pb-3 text-sm leading-relaxed text-muted-foreground">{a}</p> : null}
    </div>
  )
}

function RewardsFaqInner() {
  return (
    <section aria-label="Rewards FAQ" className={dashboardCardClass}>
      <h2 className="text-base font-semibold text-foreground">Reward FAQ</h2>
      <div className="mt-3">
        {REWARDS_FAQ.map((item) => (
          <FaqItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  )
}

export const RewardsFaq = memo(RewardsFaqInner)

export function RewardsSidebarSummary({
  totalEarned,
  rankBonus,
  referralCommission,
  achievementRewards,
  bonusRewards,
}: {
  totalEarned: string
  rankBonus: string
  referralCommission: string
  achievementRewards: string
  bonusRewards: string
}) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div className={dashboardCardClass}>
        <h3 className="font-semibold text-foreground">Reward Summary</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Rank Rewards</span>
            <span className="font-semibold text-emerald-600">{rankBonus}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Referral Commission</span>
            <span className="font-semibold text-emerald-600">{referralCommission}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Achievement Rewards</span>
            <span className="font-semibold text-emerald-600">{achievementRewards}</span>
          </li>
          <li className="flex justify-between gap-2">
            <span className="text-muted-foreground">Bonus Rewards</span>
            <span className="font-semibold text-emerald-600">{bonusRewards}</span>
          </li>
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-sm font-bold text-emerald-600">
          Total: {totalEarned}
        </p>
      </div>

      <div className={dashboardCardClass}>
        <h3 className="font-semibold text-foreground">How Rewards Work</h3>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              1
            </span>
            Complete actions and grow your network
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              2
            </span>
            Reach milestones and rank levels
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              3
            </span>
            Earn rewards and withdraw to your wallet
          </li>
        </ol>
        <Link
          href="/referral?section=payouts"
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#f97316] text-sm font-semibold text-white"
        >
          Start Earning
        </Link>
      </div>
    </aside>
  )
}
