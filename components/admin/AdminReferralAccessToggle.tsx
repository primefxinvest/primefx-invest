'use client'

import { useState, useTransition } from 'react'
import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { adminSetUserReferralAccess } from '@/lib/referral/settings-actions'
import { cn } from '@/lib/utils'

export function AdminReferralAccessToggle({
  userId,
  enabled,
  globalEnabled,
}: {
  userId: string
  enabled: boolean
  globalEnabled: boolean
}) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [pending, startTransition] = useTransition()

  const handleToggle = () => {
    const next = !isEnabled
    startTransition(async () => {
      const result = await adminSetUserReferralAccess(userId, next)
      if (!result.success) {
        toast.error(result.error ?? 'Failed to update referral access')
        return
      }
      setIsEnabled(next)
      toast.success(next ? 'Referral page access granted' : 'Referral page access revoked')
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
          <Share2 className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Referral page access</h4>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Grant this investor access to the referral dashboard, share link, and commission tracking.
            Requires the global referral program to be unlocked in Rewards settings.
          </p>
          {!globalEnabled ? (
            <p className="mt-2 text-sm text-amber-700">
              Global referral program is currently locked — unlock it on Admin → Rewards first.
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        disabled={pending || !globalEnabled}
        onClick={handleToggle}
        className={cn(
          'inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
          isEnabled
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        )}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isEnabled ? 'Granted' : 'Grant access'}
      </button>
    </div>
  )
}
