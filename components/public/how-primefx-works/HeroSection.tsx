import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import DashboardMockup from '@/components/landing/DashboardMockup'
import PhoneMockup from '@/components/landing/PhoneMockup'
import { TRUST_BADGES } from '@/lib/how-primefx-works/content'

export function HowPrimefxHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 via-white to-white pb-16 pt-8 sm:pb-20 sm:pt-10 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -right-24 top-0 size-96 rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -left-24 bottom-0 size-72 rounded-full bg-emerald-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-[#0052ff] uppercase">Guide</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              How PrimeFx Invest{' '}
              <span className="text-[#0052ff]">Works</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Everything you need to know about investing, earning, referrals, withdrawals,
              transfers and platform features. Simple, transparent, and built for your financial
              freedom.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TRUST_BADGES.map((badge) => (
                <div key={badge} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" aria-hidden />
                  <span>{badge}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0052ff] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-colors hover:bg-blue-700"
              >
                Start Investing
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/invest"
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-800 transition-colors hover:border-[#0052ff]/40 hover:bg-blue-50/50"
              >
                View Investment Plans
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative pb-16 lg:pb-20">
              <DashboardMockup />
              <div className="absolute -bottom-2 right-0 z-20 hidden w-[38%] max-w-[180px] sm:block lg:-right-6 lg:max-w-[200px]">
                <PhoneMockup half />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
