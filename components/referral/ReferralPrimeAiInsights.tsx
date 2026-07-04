'use client'

import { useMemo } from 'react'
import { ArrowRight, Bot, Lightbulb } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { SectionHeading } from '@/components/shared/SectionHeading'
import type { ReferralProgramOverview } from '@/lib/referral/analytics'

function shortRankName(fullName: string) {
  return fullName.replace(/^PrimeFx\s+/i, '')
}

type Insight = {
  id: string
  title: string
  body: string
  prompt: string
}

function buildInsights(overview: ReferralProgramOverview): Insight[] {
  const insights: Insight[] = []
  const rank = overview.rank

  if (overview.totalReferrals === 0) {
    insights.push({
      id: 'first-referral',
      title: 'Start with your first referral',
      body: 'Share your link with one investor you know personally. Personal introductions convert best.',
      prompt: 'How should I share my PrimeFx referral link to get my first referral?',
    })
  }

  if (overview.funnel.conversionRate < 25 && overview.totalReferrals > 0) {
    insights.push({
      id: 'conversion',
      title: 'Improve signup-to-investor conversion',
      body: `Your conversion rate is ${overview.funnel.conversionRate.toFixed(1)}%. Focus on referrals who complete KYC and make a first deposit.`,
      prompt: 'How can I improve my referral conversion rate on PrimeFx?',
    })
  }

  if (rank.membersRemaining > 0 && rank.current !== rank.next) {
    insights.push({
      id: 'rank',
      title: `You're ${rank.membersRemaining} members from ${shortRankName(rank.next)}`,
      body: 'Active investors in your network unlock rank rewards. Help pending referrals complete verification.',
      prompt: `I need ${rank.membersRemaining} more active members for ${shortRankName(rank.next)} rank. What strategies work best?`,
    })
  }

  if (overview.thisWeekEarnings === 0 && overview.activeInvestors > 0) {
    insights.push({
      id: 'weekly',
      title: 'Activate weekly profit share',
      body: 'You have active investors but no earnings this week. Check if downline investments are generating profits.',
      prompt: 'Why might my weekly referral profit share be zero despite active referrals?',
    })
  }

  if (overview.networkLevels[0]?.count === 0 && overview.totalReferrals > 0) {
    insights.push({
      id: 'network',
      title: 'Grow your Level 1 network',
      body: 'Direct referrals (L1) earn the highest weekly profit share. Prioritize quality L1 introductions.',
      prompt: 'How do I grow my Level 1 referral network on PrimeFx?',
    })
  }

  if (insights.length === 0) {
    insights.push({
      id: 'optimize',
      title: 'Optimize your referral strategy',
      body: 'Your network is performing well. Ask PrimeAI for personalized growth ideas based on your stats.',
      prompt: 'Analyze my referral performance and suggest ways to grow my PrimeFx network sustainably.',
    })
  }

  return insights.slice(0, 3)
}

type ReferralPrimeAiInsightsProps = {
  overview: ReferralProgramOverview
}

export function ReferralPrimeAiInsights({ overview }: ReferralPrimeAiInsightsProps) {
  const insights = useMemo(() => buildInsights(overview), [overview])

  return (
    <section aria-label="PrimeAI referral insights" className="space-y-3">
      <SectionHeading>PrimeAI referral insights</SectionHeading>
      <div className="overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-blue-50/50 shadow-sm">
        <div className="flex items-center gap-3 border-b border-violet-100/80 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0052ff]">
            <Bot className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Smart suggestions</h3>
            <p className="text-xs text-gray-500">Based on your referral activity</p>
          </div>
        </div>
        <ul className="divide-y divide-violet-100/60">
          {insights.map((insight) => (
            <li key={insight.id} className="p-5 transition-colors hover:bg-white/60">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    <p className="font-semibold text-gray-900">{insight.title}</p>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{insight.body}</p>
                </div>
                <Link
                  href={`/primeai?q=${encodeURIComponent(insight.prompt)}`}
                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Ask PrimeAI
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
