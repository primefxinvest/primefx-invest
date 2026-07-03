'use client'

import { useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import { adminFulfillRankReward } from '@/lib/admin/actions'
import type { AdminRankRewardRow } from '@/lib/admin/queries'

export function AdminReferralRankRewardsView({ rows }: { rows: AdminRankRewardRow[] }) {
  const [pending, startTransition] = useTransition()

  const handleFulfill = (rewardId: string) => {
    startTransition(async () => {
      const result = await adminFulfillRankReward(rewardId, 'Perk fulfilled by admin')
      if (!result.success) {
        toast.error(result.error ?? 'Failed to mark fulfilled')
        return
      }
      toast.success('Rank reward marked as fulfilled')
    })
  }

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Referral Rank Rewards"
        description="Cash bonuses pay automatically via cron. Mark non-cash perks (vacation, Ambassador benefits) when fulfilled."
      />

      <AdminTableCard>
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">Cash</th>
              <th className="px-4 py-3 text-left font-semibold">Perks</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No rank rewards yet.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-background/60">
                  <td className="px-4 py-3">{row.user_email}</td>
                  <td className="px-4 py-3 capitalize">{row.rank_key}</td>
                  <td className="px-4 py-3">
                    {row.cash_bonus_usd > 0 ? `$${row.cash_bonus_usd.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.perks.length ? row.perks.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-right">
                    {row.status !== 'fulfilled' && row.status !== 'paid' && row.perks.length > 0 ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleFulfill(row.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-background disabled:opacity-60"
                      >
                        {pending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Mark fulfilled
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  )
}
