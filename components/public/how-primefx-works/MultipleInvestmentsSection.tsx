import { Layers, Plus } from 'lucide-react'
import { InfoCard, SectionHeader, SectionShell } from './shared'

export function HowPrimefxMultipleInvestmentsSection() {
  return (
    <SectionShell id="multiple-investments">
      <SectionHeader
        eyebrow="Portfolio"
        title="Multiple Investments"
        subtitle="Hold more than one active investment. Each plan operates independently with its own returns and analytics."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">How it works</h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            PrimeFx Invest does not merge plans automatically. When you add a second or third
            investment, each allocation is tracked separately in your portfolio — with its own
            principal, weekly return, and performance history.
          </p>
          <ul className="mt-5 space-y-2.5 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Each investment operates independently
            </li>
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Each generates its own weekly return
            </li>
            <li className="flex items-start gap-2">
              <Layers className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Each appears separately in portfolio analytics
            </li>
          </ul>
        </InfoCard>

        <InfoCard className="bg-gradient-to-br from-blue-50/80 via-white to-white">
          <h3 className="text-lg font-bold text-gray-900">Example</h3>
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
              <p className="text-xs font-semibold tracking-wide text-orange-600 uppercase">
                Elite Plan
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">$20,000</p>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-[#0052ff] text-white">
                <Plus className="size-4" aria-hidden />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-xs font-semibold tracking-wide text-emerald-600 uppercase">
                Starter Plan (added later)
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">$200</p>
            </div>

            <div className="rounded-xl border-2 border-[#0052ff]/20 bg-white p-4 text-center">
              <p className="text-xs font-semibold tracking-wide text-[#0052ff] uppercase">
                Total Active Investments
              </p>
              <p className="mt-1 text-3xl font-bold text-gray-900">$20,200</p>
              <p className="mt-1 text-sm text-gray-500">2 independent investments</p>
            </div>
          </div>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
