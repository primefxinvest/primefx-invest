'use client'

import { Copy, Play, Share2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from '@/i18n/navigation'
import { ReferralHeroIllustration } from '@/components/referral/ReferralHeroIllustration'
import type { ReferralData } from '@/lib/data/types'
import { cn } from '@/lib/utils'

type ReferralHeroSectionProps = {
  referralData: ReferralData
}

export function ReferralHeroSection({ referralData }: ReferralHeroSectionProps) {
  const copyLink = async () => {
    if (!referralData.referralLink) return
    try {
      await navigator.clipboard.writeText(referralData.referralLink)
      toast.success('Referral link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const shareLink = async () => {
    if (!referralData.referralLink) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join PrimeFx Invest',
          text: 'Start investing smarter with PrimeFx Invest.',
          url: referralData.referralLink,
        })
        return
      } catch {
        /* fall through to copy */
      }
    }
    await copyLink()
  }

  return (
    <section
      aria-label="Referral program hero"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="relative bg-gradient-to-br from-primary/[0.07] via-card to-violet-50/50 px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_minmax(280px,360px)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Referral Center
              </span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                Program Active
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[2rem] lg:leading-tight">
              Grow your network.{' '}
              <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
                Earn with transparency.
              </span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Invite investors, earn one-time investment commissions, and receive weekly profit share
              across four network levels with full visibility into every payout.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={shareLink}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Share Referral Link
              </button>
              <Link
                href="/academy"
                className={cn(
                  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-card px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5'
                )}
              >
                <Play className="h-4 w-4" aria-hidden />
                How it works
              </Link>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:hidden"
              >
                <Copy className="h-4 w-4" aria-hidden />
                Copy link
              </button>
            </div>
          </div>

          <ReferralHeroIllustration />
        </div>
      </div>
    </section>
  )
}
