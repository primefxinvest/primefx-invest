'use client'

import { Copy, MessageCircle, Share2, Zap, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import type { ReferralData } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const SHARE_ACTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', icon: Zap, color: 'text-[#0052ff]' },
  { key: 'facebook', label: 'Share', icon: Share2, color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-muted-foreground' },
  { key: 'copy', label: 'Copy link', icon: Copy, color: 'text-foreground' },
] as const

function buildShareUrl(channel: string, link: string) {
  const text = `Join me on PrimeFx Invest and start investing smarter. Use my referral link: ${link}`
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(text)}`
    case 'telegram':
      return `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`
    case 'email':
      return `mailto:?subject=${encodeURIComponent('Join PrimeFx Invest')}&body=${encodeURIComponent(text)}`
    default:
      return link
  }
}

type ReferralLinkCenterProps = {
  referralData: ReferralData
  loading: boolean
  error: string | null
  onRetry: () => void
  compact?: boolean
}

export function ReferralLinkCenter({
  referralData,
  loading,
  error,
  onRetry,
  compact = false,
}: ReferralLinkCenterProps) {
  const copyLink = async () => {
    if (!referralData.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const copyCode = async () => {
    if (!referralData.referralCode) return
    try {
      await navigator.clipboard.writeText(referralData.referralCode)
      toast.success('Referral code copied')
    } catch {
      toast.error('Failed to copy code')
    }
  }

  const handleShare = async (channel: string) => {
    if (!referralData.referralLink) return
    if (channel === 'copy') {
      await copyLink()
      return
    }
    window.open(buildShareUrl(channel, referralData.referralLink), '_blank', 'noopener,noreferrer')
  }

  return (
    <aside aria-label="Referral link center" className="space-y-4">
      <div className={cn(cardSurfaceClass, 'overflow-hidden p-0')}>
        <div className="border-b border-border bg-primary/5 px-5 py-4">
          <h2 className="text-base font-bold text-foreground">Your referral link</h2>
          <p className="mt-1 text-xs text-muted-foreground">Share with investors you trust</p>
        </div>
        <div className="p-5">
          <AsyncState
            loading={loading && !referralData}
            error={error}
            onRetry={onRetry}
            compact
            skeleton={<div className="h-11 animate-pulse rounded-xl bg-muted" />}
          >
            <label htmlFor="referral-link-input" className="sr-only">
              Referral link
            </label>
            <div className="flex gap-2">
              <input
                id="referral-link-input"
                readOnly
                value={referralData.referralLink}
                className="min-w-0 flex-1 rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-foreground"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </button>
            </div>
          </AsyncState>

          {referralData.referralCode ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Referral code
                </p>
                <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-foreground">
                  {referralData.referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="min-h-11 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Copy code
              </button>
            </div>
          ) : null}

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SHARE_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleShare(action.key)}
                  className="flex min-h-11 min-w-[4.5rem] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-border px-3 py-2 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <Icon className={cn('h-4 w-4', action.color)} aria-hidden="true" />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {!compact ? (
        <div className={cn(cardSurfaceClass, 'text-center')}>
          <h3 className="font-semibold text-foreground">Scan to join</h3>
          <p className="mt-1 text-xs text-muted-foreground">QR code for in-person sharing</p>
          <div className="mt-4 flex justify-center">
            <ReferralQrCode value={referralData.referralLink} />
          </div>
        </div>
      ) : null}
    </aside>
  )
}
