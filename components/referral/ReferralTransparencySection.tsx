'use client'

import { Calendar, Shield, Wallet, XCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { SectionHeading } from '@/components/shared/SectionHeading'
import {
  REFERRAL_DISPLAY_INVESTMENT_COMMISSION,
  REFERRAL_DISPLAY_PROFIT_SHARE_SUMMARY,
} from '@/lib/referral/display-config'

const TRUST_POINTS = [
  {
    icon: Wallet,
    title: 'Investors keep full ownership',
    body: 'Referred members deposit and invest on their own accounts. Referral rewards never require transferring control of anyone’s funds.',
  },
  {
    icon: Calendar,
    title: 'Weekly payout schedule',
    body: 'Profit-share commissions accrue from verified weekly investment performance and are distributed on the platform’s weekly payout cycle (typically Fridays). Investment commissions pay when qualifying deposits settle.',
  },
  {
    icon: Shield,
    title: 'Transparent reward structure',
    body: `Investment commission: ${REFERRAL_DISPLAY_INVESTMENT_COMMISSION} one-time. Weekly profit share: ${REFERRAL_DISPLAY_PROFIT_SHARE_SUMMARY}. All rates are disclosed upfront — no hidden tiers.`,
  },
  {
    icon: XCircle,
    title: 'Not an MLM or membership scheme',
    body: 'PrimeFx rewards real investment activity — not recruitment fees, starter kits, or paid memberships. Sustainable referrals come from helping investors make informed decisions.',
  },
] as const

export function ReferralTransparencySection() {
  return (
    <section aria-label="Program transparency" className="space-y-3">
      <SectionHeading>Transparency & trust</SectionHeading>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
          PrimeFx Referral is built for long-term investor relationships. Rewards are tied to genuine
          platform activity — never to signing up friends without investment intent.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {TRUST_POINTS.map((point) => {
            const Icon = point.icon
            return (
              <article
                key={point.title}
                className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-5 w-5 text-[#0052ff]" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{point.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{point.body}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
        <Link
          href="/support"
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
        >
          Read full program terms in Support
        </Link>
      </div>
    </section>
  )
}
