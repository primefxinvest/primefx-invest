import { BadgeCheck, ShieldCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { KYC_STEPS } from '@/lib/how-primefx-works/content'
import { InfoCard, SectionHeader, SectionShell } from './shared'

const KYC_BENEFITS = [
  'Protects investors and the platform community',
  'Required for withdrawals and transfers',
  'Prevents fraud and unauthorized access',
  'Maintains platform integrity and compliance',
] as const

export function HowPrimefxKycSection() {
  return (
    <SectionShell id="verification">
      <SectionHeader
        eyebrow="Compliance"
        title="KYC Verification"
        subtitle="Identity verification protects investors, withdrawals, transfers, and platform integrity."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <InfoCard>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50">
              <ShieldCheck className="size-5 text-[#0052ff]" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Why verification matters</h3>
          </div>
          <ul className="space-y-2.5">
            {KYC_BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm text-gray-600">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                {benefit}
              </li>
            ))}
          </ul>
        </InfoCard>

        <InfoCard>
          <h3 className="text-lg font-bold text-gray-900">Didit verification flow</h3>
          <ol className="mt-5 space-y-4">
            {KYC_STEPS.map((step) => (
              <li key={step.step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[#0052ff] text-xs font-bold text-[#0052ff]">
                  {step.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link
            href="/profile"
            className="mt-6 inline-flex text-sm font-semibold text-[#0052ff] hover:underline"
          >
            Start verification from Profile →
          </Link>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
