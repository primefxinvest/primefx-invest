'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { adminCreateDisplayRank, adminUpdateDisplayRank } from '@/lib/admin/investment-actions'
import type { AdminDisplayRank } from '@/lib/admin/investment-types'
import { isAdminMutationFailure } from '@/lib/admin/mutation-result'
import { cn } from '@/lib/utils'

interface AdminRankManagementViewProps {
  ranks: AdminDisplayRank[]
}

export function AdminRankManagementView({ ranks: initialRanks }: AdminRankManagementViewProps) {
  const [ranks, setRanks] = useState(initialRanks)
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0052ff')
  const [description, setDescription] = useState('')

  const createRank = () => {
    if (!name.trim()) return toast.error('Rank name is required')
    startTransition(async () => {
      const result = await adminCreateDisplayRank({
        name: name.trim(),
        color,
        description: description.trim() || undefined,
        badge: name.trim().slice(0, 3).toUpperCase(),
      })
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else {
        toast.success('Custom rank created')
        setShowForm(false)
        setName('')
        setDescription('')
        window.location.reload()
      }
    })
  }

  const toggleStatus = (rank: AdminDisplayRank) => {
    const next = rank.status === 'active' ? 'inactive' : 'active'
    startTransition(async () => {
      const result = await adminUpdateDisplayRank(rank.id, { status: next })
      if (isAdminMutationFailure(result)) toast.error(result.error)
      else {
        setRanks((prev) => prev.map((r) => (r.id === rank.id ? { ...r, status: next } : r)))
        toast.success('Rank status updated')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/admin/investments" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Investment Management
      </Link>

      <AdminPageHeader
        title="Rank Management"
        description="Cosmetic display ranks only. Changes never affect wallet, investments, profits, or referrals."
        action={
          <button type="button" onClick={() => setShowForm((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Plus className="h-4 w-4" /> Create Custom Rank
          </button>
        }
      />

      {showForm ? (
        <div className="rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm">
          <h3 className="text-sm font-semibold">New Custom Rank</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rank name" className="rounded-lg border px-3 py-2 text-sm" />
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-full rounded-lg border px-1" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="rounded-lg border px-3 py-2 text-sm md:col-span-3" />
          </div>
          <button type="button" disabled={pending} onClick={createRank} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save Rank</button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ranks.map((rank) => (
          <article key={rank.id} className="rounded-xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold text-white" style={{ backgroundColor: rank.color }}>
                  {rank.badge ?? rank.name.slice(0, 3).toUpperCase()}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{rank.name}</h3>
                  <p className="text-[11px] text-muted-foreground">Priority {rank.priority}</p>
                </div>
              </div>
              <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', rank.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                {rank.status}
              </span>
            </div>
            {rank.description ? <p className="mt-3 text-xs text-muted-foreground">{rank.description}</p> : null}
            {rank.benefits.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-foreground">
                {rank.benefits.map((b) => <li key={b}>• {b}</li>)}
              </ul>
            ) : null}
            <button type="button" disabled={pending} onClick={() => toggleStatus(rank)} className="mt-4 rounded-lg border px-3 py-1.5 text-xs font-semibold">
              {rank.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
