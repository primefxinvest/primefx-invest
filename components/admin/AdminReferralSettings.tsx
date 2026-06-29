'use client'

import { useState, useTransition } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminSetReferralProgramEnabled } from '@/lib/referral/settings-actions'
import { cn } from '@/lib/utils'

interface AdminReferralSettingsProps {
  enabled: boolean
  configured: boolean
}

export function AdminReferralSettings({ enabled, configured }: AdminReferralSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [pending, startTransition] = useTransition()

  const handleToggle = () => {
    const next = !isEnabled
    startTransition(async () => {
      const result = await adminSetReferralProgramEnabled(next)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update referral program')
        return
      }
      setIsEnabled(next)
      toast.success(next ? 'Referral program unlocked for investors' : 'Referral program locked')
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Referral Program Access</h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Control whether investors with Growth tier and above can access the referral
              dashboard, share links, and earn commissions.
            </p>
            {!configured ? (
              <p className="mt-2 text-sm text-amber-700">
                Run migration <code className="rounded bg-amber-50 px-1">014_platform_features.sql</code>{' '}
                to enable admin control.
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          disabled={!configured || pending}
          onClick={handleToggle}
          className={cn(
            'inline-flex min-w-[140px] items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
            isEnabled
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          )}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isEnabled ? 'Unlocked' : 'Locked'}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Investor requirement', value: 'Growth tier+' },
          { label: 'Current status', value: isEnabled ? 'Active for investors' : 'Hidden / locked' },
          { label: 'Admin module', value: 'Rewards & Referral' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-background px-4 py-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
