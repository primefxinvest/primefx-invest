'use client'

import { Share2 } from 'lucide-react'
import { REFERRAL_PROFIT_SHARE_LEVELS, REFERRAL_RANK_TIERS } from '@/lib/referral/program-config'
import { cn } from '@/lib/utils'

interface AdminReferralSettingsProps {
  enabled: boolean
  configured: boolean
}

export function AdminReferralSettings({ enabled: _enabled, configured }: AdminReferralSettingsProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <Share2 className="h-6 w-6" />
        </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Referral Program</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              The referral program is available to every authenticated investor. Commission rules and
              payout schedules are configured below.
            </p>
            {!configured ? (
              <p className="mt-2 text-sm text-amber-700">
                Run migrations <code className="rounded bg-amber-50 px-1">014_platform_features.sql</code>,{' '}
                <code className="rounded bg-amber-50 px-1">015_referral_program_engine.sql</code>, and{' '}
                <code className="rounded bg-amber-50 px-1">016_user_referral_access.sql</code>.
              </p>
            ) : null}
          </div>
        </div>

        <span className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">
          Always enabled
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Access rule', value: 'All authenticated users' },
          { label: 'Current status', value: 'Open' },
          { label: 'Admin module', value: 'Rewards & Referral' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">Referral rank rewards</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {REFERRAL_RANK_TIERS.map((tier) => (
              <li key={tier.key}>
                <span className="font-medium text-foreground">{tier.name}</span>
                {' — '}
                {tier.minMembers} members
                {tier.cashBonusUsd > 0 ? ` · $${tier.cashBonusUsd.toLocaleString()} bonus` : ''}
                {tier.perks.length ? ` · ${tier.perks.join(', ')}` : ''}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-border bg-background p-4">
          <h3 className="text-sm font-semibold text-foreground">Weekly profit sharing (L1–L4)</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {REFERRAL_PROFIT_SHARE_LEVELS.map((level) => (
              <li key={level.level}>
                <span className="font-medium text-foreground">{level.label}</span> — {level.description}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Commissions accrue daily and pay weekly (Friday batch). Platform fees: P2P transfer
            1.20 USD fixed internal transfer fee · Withdrawal 5% · Withdrawals require a 7-day notice. Gold (XAU/USD) profits accrue
            Monday–Friday only.
          </p>
        </div>
      </div>
    </div>
  )
}
