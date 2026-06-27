'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { Ban, Eye, KeyRound, Loader2, MessageSquarePlus, Search, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import {
  addAdminNote,
  addKycReviewNote,
  adminDisableUserMfa,
  adminEnableUserMfaRequirement,
  updateUserAccountStatus,
  updateUserInvestorTier,
} from '@/lib/admin/actions'
import type { AdminUserRow } from '@/lib/admin/types'
import { formatDate } from '@/lib/data/format'
import { cn } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/custom-select'
import { useActionDialog } from '@/lib/hooks/useActionDialog'
import { KYC_STATUS_OPTIONS, useKycStatusChange } from '@/lib/hooks/useKycStatusChange'

const TIERS = ['Starter', 'Growth', 'Prime', 'Elite']

export function AdminUsersView({
  users,
  mfaSummary = {},
  dataReady = true,
}: {
  users: AdminUserRow[]
  mfaSummary?: Record<string, { bypassed: boolean; factorCount: number }>
  dataReady?: boolean
}) {
  const [search, setSearch] = useState('')
  const [pending, startTransition] = useTransition()
  const { prompt, ActionDialog } = useActionDialog()
  const {
    changeKycStatus,
    normalizeKycStatus,
    pending: kycPending,
    ActionDialog: KycActionDialog,
  } = useKycStatusChange()

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

  const handleSuspend = async (userId: string) => {
    const reason = await prompt({
      title: 'Suspend account',
      label: 'Reason for suspension',
      required: true,
      confirmLabel: 'Suspend',
    })
    if (!reason) return

    startTransition(async () => {
      try {
        await updateUserAccountStatus(userId, 'suspended', reason)
        toast.success('Account suspended')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to suspend account')
      }
    })
  }

  const handleNote = async (userId: string) => {
    const note = await prompt({
      title: 'Add admin note',
      label: 'Internal admin note',
      required: true,
      confirmLabel: 'Add note',
    })
    if (!note) return

    startTransition(async () => {
      try {
        await addAdminNote(userId, note)
        toast.success('Note added')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add note')
      }
    })
  }

  const handleKycNote = async (userId: string) => {
    const note = await prompt({
      title: 'Add KYC review comment',
      label: 'Internal KYC comment',
      required: true,
      confirmLabel: 'Add comment',
    })
    if (!note) return

    startTransition(async () => {
      try {
        await addKycReviewNote(userId, note)
        toast.success('KYC comment added')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add KYC comment')
      }
    })
  }

  const handleResetMfa = async (userId: string, email: string) => {
    const reason = await prompt({
      title: 'Reset 2FA',
      description: `Reset two-factor authentication for ${email}. The user will be able to sign in without an authenticator.`,
      label: 'Support reason',
      required: true,
      confirmLabel: 'Reset 2FA',
    })
    if (!reason) return

    startTransition(async () => {
      try {
        await adminDisableUserMfa(userId, reason)
        toast.success('2FA reset — user can sign in without authenticator')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reset 2FA')
      }
    })
  }

  const handleRestoreMfa = (userId: string) => {
    startTransition(async () => {
      try {
        await adminEnableUserMfaRequirement(userId)
        toast.success('2FA requirement restored — user can enroll again in settings')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to restore 2FA requirement')
      }
    })
  }

  const getMfaLabel = (user: AdminUserRow) => {
    if (user.mfa_disabled_at || mfaSummary[user.id]?.bypassed) {
      return { label: 'Bypassed', className: 'bg-amber-100 text-amber-700' }
    }
    if ((mfaSummary[user.id]?.factorCount ?? 0) > 0) {
      return { label: 'Enabled', className: 'bg-emerald-100 text-emerald-700' }
    }
    return { label: 'Off', className: 'bg-gray-100 text-gray-600' }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User Management"
        description="Manage accounts, tiers, KYC, and 2FA recovery"
      />

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
              <th className="px-6 py-3 text-left text-sm font-semibold">2FA</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  {!dataReady
                    ? 'Cannot load users until SUPABASE_SERVICE_ROLE_KEY is set correctly.'
                    : users.length === 0
                      ? 'No users in the app database yet.'
                      : 'No users match your search.'}
                </td>
              </tr>
            ) : (
              filtered.map((user) => {
                const mfa = getMfaLabel(user)
                return (
                  <tr key={user.id} className="hover:bg-background">
                    <td className="px-6 py-4 text-foreground">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {user.full_name || '—'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-6 py-4">
                      <CustomSelect
                        value={user.investor_tier ?? 'Starter'}
                        disabled={pending}
                        onValueChange={(tier) => handleTierChange(user.id, tier)}
                        size="sm"
                        options={TIERS.map((tier) => ({ value: tier, label: tier }))}
                        placeholder="Tier"
                        className="min-w-[6.5rem]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <CustomSelect
                        value={normalizeKycStatus(user.kyc_status)}
                        disabled={pending || kycPending}
                        onValueChange={(status) => changeKycStatus(user.id, user.kyc_status, status)}
                        size="sm"
                        options={[...KYC_STATUS_OPTIONS]}
                        placeholder="KYC"
                        className="min-w-[6.5rem]"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-semibold',
                          mfa.className
                        )}
                      >
                        {mfa.label}
                      </span>
                    </td>
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
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="rounded-lg p-2 hover:bg-background"
                          title="View details"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Link>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleKycNote(user.id)}
                          className="rounded-lg p-2 hover:bg-background"
                          title="Add KYC comment"
                        >
                          <MessageSquarePlus className="h-4 w-4 text-primary" />
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => handleNote(user.id)}
                          className="rounded-lg p-2 hover:bg-background"
                          title="Add admin note"
                        >
                          <Shield className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {user.mfa_disabled_at ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleRestoreMfa(user.id)}
                            className="rounded-lg p-2 hover:bg-background"
                            title="Restore 2FA requirement"
                          >
                            <KeyRound className="h-4 w-4 text-primary" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleResetMfa(user.id, user.email)}
                            className="rounded-lg p-2 hover:bg-background"
                            title="Reset / disable 2FA"
                          >
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </button>
                        )}
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
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ActionDialog />
      <KycActionDialog />
    </div>
  )
}
