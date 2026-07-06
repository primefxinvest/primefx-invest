import { SECURITY_FEATURES } from '@/lib/how-primefx-works/content'
import { InfoCard, SectionHeader, SectionShell } from './shared'

export function HowPrimefxSecuritySection() {
  return (
    <SectionShell id="security">
      <SectionHeader
        eyebrow="Trust"
        title="Security"
        subtitle="Institutional-grade protection for your account, data, and financial operations."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECURITY_FEATURES.map((feature) => {
          const Icon = feature.icon
          return (
            <InfoCard key={feature.title}>
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-blue-50">
                <Icon className="size-5 text-[#0052ff]" aria-hidden />
              </div>
              <h3 className="font-bold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </InfoCard>
          )
        })}
      </div>
    </SectionShell>
  )
}
