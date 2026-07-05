'use client'

import { memo } from 'react'
import {
  Check,
  Copy,
  Link2,
  Share2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
import type { ReferralData } from '@/lib/data/types'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import {
  buildReferralShareUrl,
  copyReferralText,
  shareReferralLink,
} from '@/lib/referral/share'
import { cn } from '@/lib/utils'

const PROMO_FEATURES = [
  'Instant referral tracking',
  'Real-time earnings updates',
  'Unlimited referrals',
  'Transparent commission structure',
] as const

const QUICK_SHARE = [
  { key: 'whatsapp', label: 'WhatsApp', className: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', className: 'text-sky-600' },
  { key: 'twitter', label: 'X', className: 'text-foreground' },
  { key: 'facebook', label: 'Facebook', className: 'text-blue-600' },
  { key: 'copy', label: 'Copy Link', className: 'text-primary' },
] as const

type ReferralInviteEarnSectionProps = {
  referralData: ReferralData
}

function ReferralInviteEarnSectionInner({ referralData }: ReferralInviteEarnSectionProps) {
  const { referralCode, referralLink } = referralData

  const copyCode = async () => {
    if (!referralCode) return
    const ok = await copyReferralText(referralCode)
    if (ok) {
      toast.success('Referral code copied successfully.')
      return
    }
    toast.error('Failed to copy referral code')
  }

  const copyLink = async () => {
    if (!referralLink) return
    const ok = await copyReferralText(referralLink)
    if (ok) {
      toast.success('Referral link copied successfully.')
      return
    }
    toast.error('Failed to copy referral link')
  }

  const shareNative = async () => {
    if (!referralLink) return
    const shared = await shareReferralLink(referralLink)
    if (!shared) await copyLink()
  }

  const shareChannel = async (channel: string) => {
    if (!referralLink) return

    if (channel === 'copy') {
      await copyLink()
      return
    }

    window.open(buildReferralShareUrl(channel, referralLink), '_blank', 'noopener,noreferrer')
  }

  const shareQr = async () => {
    if (!referralLink) return
    const shared = await shareReferralLink(referralLink, 'Scan to join PrimeFx Invest')
    if (!shared) await copyLink()
  }

  return (
    <section aria-label="Invite and earn" className="space-y-3 sm:space-y-4">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#2563eb] p-4 text-white shadow-lg sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold sm:text-lg">Invite friends and earn commissions</h2>
            <p className="mt-1 text-xs leading-relaxed text-violet-100 sm:text-sm">
              Earn from every qualified investment your referrals make. Share your link and grow
              your network.
            </p>
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROMO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-xs text-violet-50 sm:text-sm">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(cardSurfaceClass, 'p-3 sm:p-5')}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-foreground sm:text-base">Invite & Earn More</h3>
          <span className="text-[10px] font-semibold text-muted-foreground sm:text-xs">
            {referralData.totalReferrals} joined
          </span>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Referral Code
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
                <p className="truncate font-mono text-base font-bold tracking-wide text-foreground sm:text-lg">
                  {referralCode || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                disabled={!referralCode}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                aria-label="Copy referral code"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
              Referral Link
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Link2
                  className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  readOnly
                  value={referralLink}
                  aria-label="Referral link"
                  className="w-full truncate rounded-xl border border-border bg-muted/30 py-2.5 pl-9 pr-3 text-[11px] text-foreground outline-none sm:text-xs"
                />
              </div>
              <button
                type="button"
                onClick={copyLink}
                disabled={!referralLink}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                aria-label="Copy referral link"
              >
                <Copy className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={shareNative}
                disabled={!referralLink}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 sm:hidden"
                aria-label="Share referral link"
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={shareNative}
              disabled={!referralLink}
              className="mt-2 hidden min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50 sm:inline-flex"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share Link
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-[auto_1fr] sm:items-start">
          <ReferralQrCode
            value={referralLink}
            size={112}
            compact
            onShare={shareQr}
            className="mx-auto sm:mx-0"
          />

          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">Quick Share</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Share your link on social platforms
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {QUICK_SHARE.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => shareChannel(item.key)}
                  disabled={!referralLink}
                  className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-1.5 py-2 text-[10px] font-semibold transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50 sm:min-h-[3.5rem] sm:text-[11px]"
                >
                  {item.key === 'copy' ? (
                    <Copy className={cn('h-4 w-4', item.className)} aria-hidden />
                  ) : item.key === 'twitter' ? (
                    <span className={cn('text-sm font-black leading-none', item.className)} aria-hidden>
                      𝕏
                    </span>
                  ) : item.key === 'facebook' ? (
                    <span className={cn('text-sm font-bold leading-none', item.className)} aria-hidden>
                      f
                    </span>
                  ) : (
                    <Share2 className={cn('h-4 w-4', item.className)} aria-hidden />
                  )}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export const ReferralInviteEarnSection = memo(ReferralInviteEarnSectionInner)
