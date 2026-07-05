'use client'

import { memo } from 'react'
import { Copy, QrCode, Share2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import {
  ReferralRankShield,
  shortRankName,
} from '@/components/referral/shared/referral-rank-ui'
import type { ReferralData } from '@/lib/data/types'
import { REFERRAL_DISPLAY_INVESTMENT_COMMISSION } from '@/lib/referral/display-config'
import { referralSectionHref } from '@/lib/referral/navigation'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type ReferralOverviewSidebarProps = {
  rankName: string
  progressPercent: number
  referralData: ReferralData
  onCopyLink: () => void
  onShareLink: () => void
}

function ReferralOverviewSidebarInner({
  rankName,
  progressPercent,
  referralData,
  onCopyLink,
  onShareLink,
}: ReferralOverviewSidebarProps) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-[#1e293b] p-4 text-white shadow-lg sm:p-5">
        <p className="text-xs font-medium text-slate-400">Your Current Rank</p>
        <div className="mt-3 flex items-center gap-3">
          <ReferralRankShield rankName={rankName} size="sm" />
          <div>
            <p className="text-lg font-bold">{shortRankName(rankName)}</p>
            <p className="text-xs font-semibold text-emerald-400">
              Top {Math.max(5, 100 - progressPercent)}%
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-xs">
          <li className="flex justify-between">
            <span className="text-slate-400">Rank Bonus</span>
            <span className="font-semibold text-emerald-400">Active</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Referral Commission</span>
            <span className="font-semibold">{REFERRAL_DISPLAY_INVESTMENT_COMMISSION}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Priority Support</span>
            <span className="font-semibold">High</span>
          </li>
          <li className="flex justify-between">
            <span className="text-slate-400">Exclusive Campaigns</span>
            <span className="font-semibold">Yes</span>
          </li>
        </ul>
        <Link
          href={referralSectionHref('benefits')}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-white/20 text-sm font-semibold hover:bg-white/10"
        >
          View All Benefits
        </Link>
      </div>

      <section
        className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#6d28d9] p-4 text-white shadow-lg sm:p-5"
        aria-label="Investment commission"
      >
        <p className="text-4xl font-bold leading-none sm:text-5xl">
          {REFERRAL_DISPLAY_INVESTMENT_COMMISSION}
        </p>
        <p className="mt-1 text-sm font-semibold text-violet-200">One-time commission</p>
        <p className="mt-3 text-xs leading-relaxed text-violet-100">
          Earn when a referred investor makes their qualifying first investment or deposit. Paid
          once per referred member — transparent and tracked in your wallet.
        </p>
        <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10">
          <Wallet className="h-7 w-7 text-amber-300" aria-hidden />
        </div>
        <Link
          href={referralSectionHref('payouts')}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#ec4899] to-[#f97316] text-sm font-semibold text-white hover:opacity-95"
        >
          Learn More
        </Link>
      </section>

      <div className={cardSurfaceClass}>
        <h3 className="text-sm font-semibold text-foreground">Invite & Earn More</h3>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
          <input
            readOnly
            value={referralData.referralLink}
            className="min-w-0 flex-1 truncate bg-transparent text-xs text-muted-foreground outline-none"
            aria-label="Referral link"
          />
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-primary hover:bg-primary/10"
            aria-label="Copy referral link"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onShareLink}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ec4899] to-[#f97316] text-xs font-semibold text-white sm:text-sm"
          >
            <Share2 className="h-4 w-4" />
            Share Link
          </button>
          <button
            type="button"
            onClick={onCopyLink}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted sm:text-sm"
          >
            <QrCode className="h-4 w-4" />
            QR Code
          </button>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          {referralData.totalReferrals} people joined using your link
        </p>
      </div>

      <div className={cardSurfaceClass}>
        <h3 className="text-sm font-semibold text-foreground">How It Works</h3>
        <ol className="mt-3 space-y-2.5 text-xs text-muted-foreground">
          <li>
            <strong className="text-foreground">1. Refer</strong> — Share your unique link
          </li>
          <li>
            <strong className="text-foreground">2. They Invest</strong> — Qualifying first deposit
          </li>
          <li>
            <strong className="text-foreground">3. You Earn</strong> — {REFERRAL_DISPLAY_INVESTMENT_COMMISSION} commission
          </li>
        </ol>
        <Link
          href="/academy"
          className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline"
        >
          View Full Guide →
        </Link>
      </div>
    </aside>
  )
}

export const ReferralOverviewSidebar = memo(ReferralOverviewSidebarInner)
