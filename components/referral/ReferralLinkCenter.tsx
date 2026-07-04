'use client'

import { Copy, MessageCircle, Share2, Zap, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { AsyncState } from '@/components/shared/data-state'
import { ReferralQrCode } from '@/components/referral/ReferralQrCode'
import type { ReferralData } from '@/lib/data/types'
import { cn } from '@/lib/utils'

const SHARE_ACTIONS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600' },
  { key: 'telegram', label: 'Telegram', icon: Zap, color: 'text-[#0052ff]' },
  { key: 'facebook', label: 'Share', icon: Share2, color: 'text-blue-600' },
  { key: 'email', label: 'Email', icon: Mail, color: 'text-gray-600' },
  { key: 'copy', label: 'Copy link', icon: Copy, color: 'text-gray-700' },
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
}

export function ReferralLinkCenter({
  referralData,
  loading,
  error,
  onRetry,
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
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#0052ff]/5 to-violet-50/50 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">Your referral link</h2>
          <p className="mt-1 text-xs text-gray-500">Share with investors you trust</p>
        </div>
        <div className="p-5">
          <AsyncState
            loading={loading && !referralData}
            error={error}
            onRetry={onRetry}
            compact
            skeleton={<div className="h-11 animate-pulse rounded-xl bg-gray-100" />}
          >
            <label htmlFor="referral-link-input" className="sr-only">
              Referral link
            </label>
            <div className="flex gap-2">
              <input
                id="referral-link-input"
                readOnly
                value={referralData.referralLink}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-800"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0052ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Copy className="h-4 w-4" aria-hidden="true" />
                Copy
              </button>
            </div>
          </AsyncState>

          {referralData.referralCode ? (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  Referral code
                </p>
                <p className="mt-0.5 font-mono text-lg font-bold tracking-wide text-gray-900">
                  {referralData.referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={copyCode}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Copy code
              </button>
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHARE_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleShare(action.key)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-gray-200 px-2 py-3 text-[11px] font-semibold text-gray-700 transition-colors hover:border-[#0052ff]/30 hover:bg-blue-50/50"
                >
                  <Icon className={cn('h-4 w-4', action.color)} aria-hidden="true" />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        <h3 className="font-semibold text-gray-900">Scan to join</h3>
        <p className="mt-1 text-xs text-gray-500">QR code for in-person sharing</p>
        <div className="mt-4 flex justify-center">
          <ReferralQrCode value={referralData.referralLink} />
        </div>
      </div>
    </aside>
  )
}
