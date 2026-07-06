import { AlertTriangle, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { PRIMEAI_CAPABILITIES } from '@/lib/how-primefx-works/content'
import { InfoCard, SectionHeader, SectionShell } from './shared'

export function HowPrimefxPrimeAiSection() {
  return (
    <SectionShell id="primeai" variant="muted">
      <SectionHeader
        eyebrow="AI"
        title="PrimeAI"
        subtitle="Your intelligent investment assistant — analyze, compare, and plan with AI-powered guidance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRIMEAI_CAPABILITIES.map((capability) => {
          const Icon = capability.icon
          return (
            <InfoCard key={capability.title}>
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-purple-50">
                <Icon className="size-5 text-[#0052ff]" aria-hidden />
              </div>
              <h3 className="font-bold text-gray-900">{capability.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {capability.description}
              </p>
            </InfoCard>
          )
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <InfoCard className="border-amber-200 bg-amber-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h3 className="font-bold text-gray-900">Important disclaimer</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                PrimeAI can make mistakes. Check important information before making financial
                decisions. PrimeAI provides educational guidance — not personalized financial advice.
              </p>
            </div>
          </div>
        </InfoCard>

        <InfoCard className="bg-gradient-to-br from-[#0f1f4d] to-[#1a3270] text-white">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="size-5 text-blue-200" aria-hidden />
            </div>
            <div>
              <h3 className="font-bold">Try PrimeAI today</h3>
              <p className="mt-1 text-sm text-blue-100">
                Ask questions about your portfolio, plans, and strategy.
              </p>
            </div>
          </div>
          <Link
            href="/primeai"
            className="mt-5 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0052ff] transition-colors hover:bg-blue-50"
          >
            Open PrimeAI
          </Link>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
