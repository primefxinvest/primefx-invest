'use client'

import { useMemo, useState, useTransition } from 'react'
import { Ban, Loader2, Search, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  addAdminNote,
  updateUserAccountStatus,
  updateUserInvestorTier,
} from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/types'
import { formatDate } from '@/lib/data/format'
import { cn } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/custom-select'

const TIERS = ['Starter', 'Growth', 'Prime', 'Elite']

export function AdminUsersView({ users }: { users: AdminUserRow[] }) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(term) ||
        (u.full_name?.toLowerCase().includes(term) ?? false)
    )
  }, [search, users])

  const handleTierChange = (userId: string, tier: string) => {
    startTransition(async () => {
      try {
        await updateUserInvestorTier(userId, tier)
        toast.success('Investor tier updated')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update tier')
      }
    })
  }

  const handleSuspend = (userId: string) => {
    const reason = window.prompt('Reason for suspension (required):')
    if (!reason?.trim()) return

    startTransition(async () => {
      try {
        await updateUserAccountStatus(userId, 'suspended', reason)
        toast.success('Account suspended')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to suspend account')
      }
    })
  }

  const handleNote = (userId: string) => {
    const note = window.prompt('Internal admin note:')
    if (!note?.trim()) return

    startTransition(async () => {
      try {
        await addAdminNote(userId, note)
        toast.success('Note added')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add note')
      }
    })
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="User Management" description="Manage user accounts and access" />

      <div className="flex max-w-xl items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">KYC</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className="hover:bg-background">
                  <td className="px-6 py-4 text-foreground">{user.full_name || '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <CustomSelect
                      value={user.investor_tier ?? 'Starter'}
                      disabled={pending}
                      onValueChange={(tier) => handleTierChange(user.id, tier)}
                      size="sm"
                      align="start"
                      options={TIERS.map((tier) => ({ value: tier, label: tier }))}
                      placeholder="Tier"
                      className="min-w-[6.5rem]"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm">{user.kyc_status}</td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        'rounded-full px-3 py-1 text-xs font-semibold',
                        user.account_status === 'active'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-700'
                      )}
                    >
                      {user.account_status ?? 'active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(user.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleNote(user.id)}
                        className="rounded-lg p-2 hover:bg-background"
                        title="Add note"
                      >
                        <Shield className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        type="button"
                        disabled={pending || user.account_status !== 'active'}
                        onClick={() => handleSuspend(user.id)}
                        className="rounded-lg p-2 hover:bg-background"
                        title="Suspend"
                      >
                        {pending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Ban className="h-4 w-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
