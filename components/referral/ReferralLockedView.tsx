'use client'

import { Gift, Lock, Share2, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export function ReferralLockedView({
  globalEnabled = false,
  userEnabled = false,
}: {
  globalEnabled?: boolean
  userEnabled?: boolean
}) {
  const title = !globalEnabled
    ? 'Referral program is not active yet'
    : 'Referral access has not been granted to your account'

  const description = !globalEnabled
    ? 'The referral program is currently disabled platform-wide. An administrator must turn it on before any investor can access it.'
    : 'The referral program is active, but your account does not have access yet. Contact support or ask an administrator to enable referral access for you in User Management.'

  return (
    <div className="mx-auto max-w-3xl py-8">
      <div className="overflow-hidden rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 shadow-sm">
        <div className="grid gap-8 p-8 md:grid-cols-[1fr_220px] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
              <Lock className="h-3.5 w-3.5" />
              Referral access required
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-[#0052ff]" />
                Welcome bonus for you and your referrals
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Up to 5% weekly profit share across 4 network levels
              </li>
              <li className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-emerald-600" />
                Share links on WhatsApp, Telegram, and more
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/support"
                className="inline-flex items-center justify-center rounded-lg bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
              >
                Contact support
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to dashboard
              </Link>
            </div>
          </div>

          <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.8),transparent_55%)]" />
            <div className="relative text-center">
              <Lock className="mx-auto h-12 w-12 text-violet-600" />
              <Share2 className="mx-auto mt-3 h-10 w-10 text-[#0052ff]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-violet-700">
                Admin controlled
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-gray-500">
        {globalEnabled && !userEnabled
          ? 'Access is granted per user by an administrator — not by investor tier or ambassador rank.'
          : 'An administrator must enable the referral program before investors can participate.'}
      </p>
    </div>
  )
}
