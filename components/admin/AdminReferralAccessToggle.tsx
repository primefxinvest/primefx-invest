'use client'

import { CheckCircle2, Share2 } from 'lucide-react'

export function AdminReferralAccessToggle({
  enabled,
}: {
  userId: string
  enabled: boolean
  globalEnabled: boolean
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Share2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Referral page access</h4>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Referral access is enabled for all investors automatically. Commissions, tracking, and
            payouts continue without per-user approval.
          </p>
        </div>
      </div>

      <span className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
        {enabled ? 'Enabled' : 'Enabled'}
      </span>
    </div>
  )
}
