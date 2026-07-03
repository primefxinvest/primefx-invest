'use client'

import { useState, useTransition } from 'react'
import { Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  createInvestmentPlan,
  deleteInvestmentPlan,
  togglePlanActive,
  updateInvestmentPlan,
} from '@/lib/admin/actions'
import type { AdminPlanRow } from '@/lib/admin/types'
import { formatCurrency } from '@/lib/data/format'
import { cn } from '@/lib/utils'
import { useActionDialog } from '@/lib/hooks/useActionDialog'

const EMPTY_FORM = {
  name: '',
  weekly_roi: '5',
  risk_level: 'Medium',
  minimum_investment: '50',
  max_investment: '',
  duration: 'Flexible',
  payout_frequency: 'Daily',
  description: '',
  visibility: 'public',
  max_investors: '',
}

type PlanFormState = typeof EMPTY_FORM

function planToForm(plan: AdminPlanRow): PlanFormState {
  return {
    name: plan.name,
    weekly_roi: String(plan.weekly_roi),
    risk_level: plan.risk_level,
    minimum_investment: String(plan.minimum_investment),
    max_investment: plan.max_investment != null ? String(plan.max_investment) : '',
    duration: plan.duration ?? 'Flexible',
    payout_frequency: plan.payout_frequency ?? 'Daily',
    description: plan.description ?? '',
    visibility: plan.visibility ?? 'public',
    max_investors: plan.max_investors != null ? String(plan.max_investors) : '',
  }
}

export function AdminPlansView({ plans }: { plans: AdminPlanRow[] }) {
  const [pending, startTransition] = useTransition()
  const { confirm, ActionDialog } = useActionDialog()
  const [editing, setEditing] = useState<AdminPlanRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM)

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setCreating(true)
  }

  const openEdit = (plan: AdminPlanRow) => {
    setCreating(false)
    setEditing(plan)
    setForm(planToForm(plan))
  }

  const closeModal = () => {
    setCreating(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      weekly_roi: Number(form.weekly_roi),
      risk_level: form.risk_level,
      minimum_investment: Number(form.minimum_investment),
      max_investment: form.max_investment ? Number(form.max_investment) : null,
      duration: form.duration,
      payout_frequency: form.payout_frequency,
      description: form.description.trim() || undefined,
      visibility: form.visibility,
      max_investors: form.max_investors ? Number(form.max_investors) : null,
    }

    if (!payload.name || !Number.isFinite(payload.weekly_roi) || !Number.isFinite(payload.minimum_investment)) {
      toast.error('Name, ROI, and minimum investment are required.')
      return
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updateInvestmentPlan(editing.id, payload)
          toast.success('Plan updated')
        } else {
          await createInvestmentPlan(payload)
          toast.success('Plan created')
        }
        closeModal()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save plan')
      }
    })
  }

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

  const handleDelete = async (plan: AdminPlanRow) => {
    const hasInvestors = Number(plan.investor_count ?? 0) > 0
    const confirmed = await confirm({
      title: hasInvestors ? 'Deactivate plan' : 'Delete plan',
      description: hasInvestors
        ? `"${plan.name}" has active investors and will be hidden from the marketplace.`
        : `Permanently delete "${plan.name}"? This cannot be undone.`,
      confirmLabel: hasInvestors ? 'Deactivate' : 'Delete',
      destructive: true,
    })
    if (!confirmed) return

    startTransition(async () => {
      try {
        await deleteInvestmentPlan(plan.id)
        toast.success('Plan removed')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to remove plan')
      }
    })
  }

  const showModal = creating || editing

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AdminPageHeader
          title="Investment Plans"
          description="Create, edit, and manage marketplace investment plans"
        />
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add plan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No investment plans found.</p>
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.visibility ?? 'public'} · {plan.payout_frequency ?? 'Daily'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleToggle(plan.id, !plan.is_active)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold',
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
                {plan.max_investment != null ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maximum</span>
                    <span className="font-semibold">{formatCurrency(plan.max_investment)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk</span>
                  <span className="font-semibold">{plan.risk_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investors</span>
                  <span className="font-semibold">
                    {(plan.investor_count ?? 0).toLocaleString()}
                    {plan.max_investors ? ` / ${plan.max_investors}` : ''}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openEdit(plan)}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-background"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleDelete(plan)}
                  className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold">{editing ? 'Edit plan' : 'Create plan'}</h3>
            <div className="mt-4 space-y-3">
              {[
                ['name', 'Plan name', 'text'],
                ['weekly_roi', 'Weekly ROI (%)', 'number'],
                ['risk_level', 'Risk level', 'text'],
                ['minimum_investment', 'Minimum investment (USD)', 'number'],
                ['max_investment', 'Maximum investment (USD)', 'number'],
                ['duration', 'Duration', 'text'],
                ['payout_frequency', 'Payout frequency', 'text'],
                ['visibility', 'Visibility (public/private)', 'text'],
                ['max_investors', 'Max investors', 'number'],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof PlanFormState]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending ? 'Saving...' : editing ? 'Save changes' : 'Create plan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ActionDialog />
    </div>
  )
}
