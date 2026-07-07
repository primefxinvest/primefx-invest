'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { ArrowLeft, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminTableCard } from '@/components/admin/AdminTableCard'
import { formatCurrency } from '@/lib/data/format'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import {
  adminAssignDisplayRank,
  adminLogInvestmentViewed,
  adminUpdateInvestmentStatus,
} from '@/lib/admin/investment-actions'
import type { AdminDisplayRank, AdminInvestmentDetail } from '@/lib/admin/investment-types'
import { isAdminMutationFailure } from '@/lib/admin/mutation-result'

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function Countdown({ target }: { target: string | null }) {
  const [label, setLabel] = useState('—')

  useEffect(() => {
    if (!target) return
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now()
      if (diff <= 0) {
        setLabel('Due now')
        return
      }
      const hours = Math.floor(diff / 3_600_000)
      const minutes = Math.floor((diff % 3_600_000) / 60_000)
      setLabel(`${hours}h ${minutes}m`)
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [target])

  return <span className="font-semibold text-primary">{label}</span>
}

interface AdminInvestmentDetailViewProps {
  detail: AdminInvestmentDetail
  ranks: AdminDisplayRank[]
}

export function AdminInvestmentDetailView({ detail, ranks }: AdminInvestmentDetailViewProps) {
  const [pending, startTransition] = useTransition()
  const { investment, user, wallet } = detail
  const roi = useMemo(
    () => (investment.amount > 0 ? ((investment.current_value - investment.amount) / investment.amount) * 100 : 0),
    [investment.amount, investment.current_value]
  )

  useEffect(() => {
    void adminLogInvestmentViewed(investment.id, user.id)
  }, [investment.id, user.id])

  const updateStatus = (status: string) => {
    startTransition(async () => {
      const result = await adminUpdateInvestmentStatus(investment.id, status)
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else toast.success('Investment status updated')
    })
  }

  const updateRank = (rankId: string) => {
    startTransition(async () => {
      const result = await adminAssignDisplayRank(user.id, rankId || null)
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else toast.success('Display rank updated (cosmetic only)')
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/investments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to investments
        </Link>
      </div>

      <AdminPageHeader
        title={`Investment ${investment.reference_id ?? investment.id.slice(0, 8)}`}
        description={`${investment.plan_name} · ${formatCurrency(investment.amount)}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={pending} onClick={() => updateStatus('Active')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Activate</button>
            <button type="button" disabled={pending} onClick={() => updateStatus('Suspended')} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white">Suspend</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm lg:col-span-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" /> User</h3>
          <Link href={`/admin/users/${user.id}`} className="mt-3 flex items-center gap-3 rounded-lg hover:bg-muted/40 p-2 -mx-2">
            <img src={user.avatar_url ?? getDefaultAvatarUrl(user.email)} alt="" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <p className="font-semibold text-foreground">{user.full_name ?? user.email}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </Link>
          <dl className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between"><dt className="text-muted-foreground">Country</dt><dd>{user.country ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">KYC</dt><dd>{user.kyc_status ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Account</dt><dd>{user.account_status ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Investor Tier</dt><dd>{user.investor_tier ?? '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Display Rank</dt><dd>{user.display_rank_name ?? '—'}</dd></div>
          </dl>
          <label className="mt-4 block text-xs font-semibold text-muted-foreground">Assign Display Rank</label>
          <select disabled={pending} defaultValue="" onChange={(e) => updateRank(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-xs">
            <option value="">No rank</option>
            {ranks.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </section>

        <section className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm lg:col-span-1">
          <h3 className="text-sm font-semibold">Investment</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd className="font-semibold">{investment.plan_name}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Invested</dt><dd>{formatCurrency(investment.amount)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Current Value</dt><dd>{formatCurrency(investment.current_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Accumulated Profit</dt><dd className="text-emerald-600 font-semibold">{formatCurrency(investment.accumulated_profit)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Weekly ROI</dt><dd>{investment.roi_percentage.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Daily Profit</dt><dd>{formatCurrency(investment.daily_profit)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">ROI</dt><dd className="font-semibold">{roi.toFixed(2)}%</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Status</dt><dd>{investment.status}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Start Date</dt><dd>{formatDateTime(investment.start_date)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Next Payout</dt><dd>{formatDateTime(investment.next_payout_at)}</dd></div>
            <div className="flex justify-between items-center"><dt className="text-muted-foreground">Countdown</dt><dd><Countdown target={investment.next_payout_at} /></dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Withdrawal Unlock</dt><dd>{formatDateTime(investment.capital_withdrawal_unlock_at)}</dd></div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm lg:col-span-1">
          <h3 className="text-sm font-semibold">Wallet</h3>
          {wallet ? (
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-muted-foreground">Available</dt><dd>{formatCurrency(wallet.available_balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-semibold">{formatCurrency(wallet.total_balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Pending</dt><dd>{formatCurrency(wallet.pending_balance)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Bonus</dt><dd>{formatCurrency(wallet.bonus_balance)}</dd></div>
            </dl>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No wallet record.</p>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card/80 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Clock className="h-4 w-4" /> Timeline</h3>
        <ul className="mt-3 space-y-2">
          {detail.timeline.slice(0, 25).map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2 text-xs">
              <div>
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-muted-foreground">{item.detail}</p>
              </div>
              <span className="shrink-0 text-muted-foreground">{formatDateTime(item.at)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section>
          <h3 className="mb-2 text-sm font-semibold">Profit History</h3>
          <AdminTableCard>
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50 text-muted-foreground"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Rate</th></tr></thead>
              <tbody>
                {detail.profitHistory.map((p) => (
                  <tr key={p.id} className="border-b border-border/50"><td className="px-3 py-2">{p.period_date}</td><td className="px-3 py-2 font-semibold text-emerald-600">{formatCurrency(p.amount_usd)}</td><td className="px-3 py-2">{(p.daily_rate * 100).toFixed(4)}%</td></tr>
                ))}
              </tbody>
            </table>
          </AdminTableCard>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Transactions</h3>
          <AdminTableCard>
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50 text-muted-foreground"><th className="px-3 py-2">Type</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>
                {detail.transactions.map((t) => (
                  <tr key={t.id} className="border-b border-border/50"><td className="px-3 py-2">{t.type}</td><td className="px-3 py-2">{formatCurrency(t.amount)}</td><td className="px-3 py-2">{t.status}</td></tr>
                ))}
              </tbody>
            </table>
          </AdminTableCard>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Withdrawal History</h3>
          <AdminTableCard>
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50 text-muted-foreground"><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Requested</th></tr></thead>
              <tbody>
                {detail.withdrawalHistory.map((w) => (
                  <tr key={w.id} className="border-b border-border/50"><td className="px-3 py-2">{formatCurrency(w.amount_usd)}</td><td className="px-3 py-2">{w.status}</td><td className="px-3 py-2">{formatDateTime(w.requested_at)}</td></tr>
                ))}
              </tbody>
            </table>
          </AdminTableCard>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold">Referral Commissions Generated</h3>
          <AdminTableCard>
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-muted/50 text-muted-foreground"><th className="px-3 py-2">Level</th><th className="px-3 py-2">Commission</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody>
                {detail.referralCommissions.map((c) => (
                  <tr key={c.id} className="border-b border-border/50"><td className="px-3 py-2">L{c.level}</td><td className="px-3 py-2">{formatCurrency(c.commission_usd)}</td><td className="px-3 py-2">{c.status}</td></tr>
                ))}
              </tbody>
            </table>
          </AdminTableCard>
        </section>
      </div>
    </div>
  )
}
