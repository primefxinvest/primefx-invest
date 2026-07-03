'use client'

import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'

interface RewardTier {
  id: string
  tier_name: string
  minimum_points: number
  bonus_percentage: number | null
  benefits: string | null
}

export function AdminRewardsView({ tiers }: { tiers: RewardTier[] }) {
  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader title="Rewards Management" description="Manage reward tiers and benefits" />

      <AdminTableCard>
        <table className="w-full min-w-[560px]">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Min Points</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Bonus %</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Benefits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No reward tiers configured.
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} className="hover:bg-background">
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      {tier.tier_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {tier.minimum_points.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{tier.bonus_percentage ?? 0}%</td>
                  <td className="px-6 py-4 text-sm">{tier.benefits || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminTableCard>
    </div>
  )
}
