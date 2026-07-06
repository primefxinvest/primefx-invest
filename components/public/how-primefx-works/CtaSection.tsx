import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PLATFORM_METRICS } from '@/lib/how-primefx-works/content'
import { SectionHeader, SectionShell } from './shared'

export function HowPrimefxCtaSection() {
  return (
    <SectionShell id="get-started" variant="blue" className="pb-0">
      <div className="pb-14 sm:pb-16 lg:pb-20">
        <SectionHeader
          title="Ready to Start Your Investment Journey?"
          subtitle="Join a global community of investors. Open your account, explore plans, and start building with transparency."
          light
        />

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0052ff] shadow-lg transition-colors hover:bg-blue-50"
          >
            Open Investor Account
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/invest"
            className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Explore Investment Plans
          </Link>
        </div>
      </div>

      <div className="border-t border-white/15 py-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {PLATFORM_METRICS.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="flex flex-col items-center text-center">
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-blue-200" aria-hidden />
                </div>
                <p className="text-xl font-bold text-white sm:text-2xl">{metric.value}</p>
                <p className="mt-0.5 text-xs text-blue-200 sm:text-sm">{metric.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}
