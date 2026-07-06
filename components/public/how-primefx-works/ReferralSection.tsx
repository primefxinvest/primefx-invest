import { Link } from '@/i18n/navigation'
import { REFERRAL_FLOW, REFERRAL_LEVELS } from '@/lib/how-primefx-works/content'
import { InfoCard, SectionHeader, SectionShell } from './shared'

export function HowPrimefxReferralSection() {
  return (
    <SectionShell id="referral-program" variant="muted">
      <SectionHeader
        eyebrow="Referral"
        title="Referral Program"
        subtitle="Share PrimeFx Invest with others and earn commissions according to program terms. No income guarantees — rewards depend on referred member activity."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">How referral works</h3>
          <ol className="mt-5 space-y-4">
            {REFERRAL_FLOW.map((item) => (
              <li key={item.step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0052ff] text-xs font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/referral"
            className="mt-6 inline-flex text-sm font-semibold text-[#0052ff] hover:underline"
          >
            Open Referral Dashboard →
          </Link>
        </InfoCard>

        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">Commission levels</h3>
          <p className="mt-2 text-sm text-gray-600">
            Profit-share commissions are tiered by referral depth. Rates are applied to referred
            members&apos; weekly profits according to program rules.
          </p>

          <div className="mt-5 space-y-3">
            {REFERRAL_LEVELS.map((level) => (
              <div
                key={level.level}
                className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#0052ff]/10 text-xs font-bold text-[#0052ff]">
                    {level.label}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Level {level.level}</p>
                    <p className="text-xs text-gray-500">{level.description}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-[#0052ff]">{level.rate}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Commission eligibility and rates are defined in the referral program terms. Past
            performance of referrals does not guarantee future earnings.
          </p>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
