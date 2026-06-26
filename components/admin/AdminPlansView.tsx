'use client'

import { useTransition } from 'react'
import { Loader2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { togglePlanActive } from '@/lib/admin/actions'
import type { AdminPlanRow } from '@/lib/admin/types'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'

export function AdminPlansView({ plans }: { plans: AdminPlanRow[] }) {
  const [pending, startTransition] = useTransition()

  const handleToggle = (planId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await togglePlanActive(planId, isActive)
        toast.success(isActive ? 'Plan activated' : 'Plan deactivated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update plan')
      }
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Investment Plans"
        description="Manage investment plan offerings"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investment plans found.</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.visibility ?? 'public'} · {plan.payout_frequency ?? 'Weekly'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggle(plan.id, !plan.is_active)}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold',
                    plan.is_active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {pending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Power className="h-3 w-3" />
                  )}
                  {plan.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weekly ROI</span>
                  <span className="font-semibold">{plan.weekly_roi}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum</span>
                  <span className="font-semibold">{formatCurrency(plan.minimum_investment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Level</span>
                  <span className="font-semibold">{plan.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investors</span>
                  <span className="font-semibold">{(plan.investor_count ?? 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
