'use client'

import { HowItWorksSteps } from '@/components/ui/steps'
import { howItWorksSteps } from '@/lib/invest/plan-config'

export default function InvestHowItWorksPanel() {
  return (
    <section
      id="how-it-works"
      className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-4 shadow-sm sm:p-5"
    >
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#0052ff]">Simple process</p>
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">How investing works</h2>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-gray-500 sm:text-right sm:text-sm">
          Pick a plan below, fund your wallet, and daily profits are credited on trading days (Mon–Fri).
          Capital can be withdrawn with a short notice period.
        </p>
      </div>
      <HowItWorksSteps steps={howItWorksSteps} />
    </section>
  )
}
