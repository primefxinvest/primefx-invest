'use client'

import { Check, Sparkles } from 'lucide-react'
import type { InvestmentPlan } from '@/lib/invest/plan-config'
import { getPlanTheme } from '@/lib/invest/plan-config'

interface AIRecommendationBannerProps {
  recommendedPlan: InvestmentPlan
  onGetRecommendation: () => void
  onInvestRecommended: () => void
}

export default function AIRecommendationBanner({
  recommendedPlan,
  onGetRecommendation,
  onInvestRecommended,
}: AIRecommendationBannerProps) {
  const theme = getPlanTheme(recommendedPlan)
  const Icon = theme.icon

  return (
    <div className="overflow-hidden rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-white to-purple-50 shadow-sm">
      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Not sure which plan is right for you?</h3>
          <p className="mt-2 text-sm text-gray-500">
            Let PrimeAI analyze your profile and recommend the best investment plan for your goals.
          </p>
          <button
            type="button"
            onClick={onGetRecommendation}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4" />
            Get AI Recommendation
          </button>
        </div>

        <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${theme.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  PrimeAI Recommendation
                </p>
                <p className="mt-0.5 text-base font-bold text-gray-900">{recommendedPlan.name}</p>
                <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  Best Match
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e9d5ff" strokeWidth="4" />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="4"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - 0.92)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-sm font-bold text-purple-600">92%</span>
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Match Score</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {[
              `${recommendedPlan.roiRange} monthly ROI potential`,
              `${recommendedPlan.riskLevel} risk suitable for your portfolio`,
              `${recommendedPlan.investors} investors trust this plan`,
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onInvestRecommended}
            className="mt-4 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Invest in {recommendedPlan.name}
          </button>
        </div>
      </div>
    </div>
  )
}
