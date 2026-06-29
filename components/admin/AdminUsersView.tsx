'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  Ban,
  Eye,
  KeyRound,
  Loader2,
  MessageSquarePlus,
  MoreVertical,
  Search,
  Shield,
} from 'lucide-react'
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
import { isAdminMutationFailure } from '@/lib/admin/mutation-result'
import { getDefaultAvatarUrl } from '@/lib/profile/avatar'
import { cn } from '@/lib/utils'
import { CustomSelect } from '@/components/ui/custom-select'
import { useActionDialog } from '@/lib/hooks/useActionDialog'
import { KYC_STATUS_OPTIONS, useKycStatusChange } from '@/lib/hooks/useKycStatusChange'

const TIERS = ['Starter', 'Growth', 'Prime', 'Elite']

function formatJoinedDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  }).format(new Date(value))
}

const ACTIONS_MENU_WIDTH = 176

function AdminUserActionsMenu({
  user,
  pending,
  isSelf,
  onKycNote,
  onNote,
  onResetMfa,
  onRestoreMfa,
  onSuspend,
}: {
  user: AdminUserRow
  pending: boolean
  isSelf: boolean
  onKycNote: () => void
  onNote: () => void
  onResetMfa: () => void
  onRestoreMfa: () => void
  onSuspend: () => void
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({})
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (!open || !triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    const left = Math.max(8, Math.min(rect.right - ACTIONS_MENU_WIDTH, window.innerWidth - ACTIONS_MENU_WIDTH - 8))

    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left,
      width: ACTIONS_MENU_WIDTH,
      zIndex: 9999,
    })
  }, [open])

  useEffect(() => {
    if (!open) return

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  useEffect(() => {
    if (!open) return

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [open])

  const itemClass =
    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs text-foreground hover:bg-background disabled:cursor-not-allowed disabled:opacity-40'

  const menuPanel = open ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="rounded-lg border border-border bg-popover p-1 shadow-lg"
    >
      <button type="button" disabled={pending} onClick={() => { setOpen(false); onKycNote() }} className={itemClass}>
        <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 text-primary" />
        KYC comment
      </button>
      <button type="button" disabled={pending} onClick={() => { setOpen(false); onNote() }} className={itemClass}>
        <Shield className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        Admin note
      </button>
      {user.mfa_disabled_at ? (
        <button
          type="button"
          disabled={pending || isSelf}
          onClick={() => { setOpen(false); onRestoreMfa() }}
          className={itemClass}
          title={isSelf ? 'You cannot change 2FA on your own account' : undefined}
        >
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-primary" />
          Restore 2FA
        </button>
      ) : (
        <button
          type="button"
          disabled={pending || isSelf}
          onClick={() => { setOpen(false); onResetMfa() }}
          className={itemClass}
          title={isSelf ? 'You cannot reset 2FA on your own account' : undefined}
        >
          <KeyRound className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          Reset 2FA
        </button>
      )}
      <button
        type="button"
        disabled={pending || user.account_status !== 'active' || isSelf}
        onClick={() => { setOpen(false); onSuspend() }}
        className={itemClass}
        title={isSelf ? 'You cannot suspend your own account' : undefined}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-red-500" />
        ) : (
          <Ban className="h-3.5 w-3.5 shrink-0 text-red-500" />
        )}
        Suspend
      </button>
    </div>
  ) : null

  return (
    <>
      <div className="inline-flex items-center">
        <Link
          href={`/admin/users/${user.id}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-background"
          title="View details"
        >
          <Eye className="h-3.5 w-3.5 text-primary" />
        </Link>
        <button
          ref={triggerRef}
          type="button"
          disabled={pending}
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
          title="More actions"
          aria-expanded={open}
        >
          <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      {typeof document !== 'undefined' && menuPanel ? createPortal(menuPanel, document.body) : null}
    </>
  )
}

function AdminUserIdentityCell({ user }: { user: AdminUserRow }) {
  const displayName = user.full_name?.trim() || 'Unknown user'
  const avatarSrc = user.avatar_url || getDefaultAvatarUrl(user.email || user.id)

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-90"
    >
      <img
        src={avatarSrc}
        alt={displayName}
        className="h-9 w-9 shrink-0 rounded-full border border-border bg-muted object-cover"
      />
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground hover:text-primary">{displayName}</p>
        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
      </div>
    </Link>
  )
}

export function AdminUsersView({
  users,
  mfaSummary = {},
  dataReady = true,
  currentAdminUserId,
}: {
  users: AdminUserRow[]
  mfaSummary?: Record<string, { bypassed: boolean; factorCount: number }>
  dataReady?: boolean
  currentAdminUserId?: string
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
        const result = await updateUserInvestorTier(userId, tier)
        if (isAdminMutationFailure(result)) {
          toast.error(result.error)
          return
        }
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
        const result = await updateUserAccountStatus(userId, 'suspended', reason)
        if (isAdminMutationFailure(result)) {
          toast.error(result.error)
          return
        }
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
        const result = await adminDisableUserMfa(userId, reason)
        if (isAdminMutationFailure(result)) {
          toast.error(result.error)
          return
        }
        toast.success('2FA reset — user can sign in without authenticator')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reset 2FA')
      }
    })
  }

  const handleRestoreMfa = (userId: string) => {
    startTransition(async () => {
      try {
        const result = await adminEnableUserMfaRequirement(userId)
        if (isAdminMutationFailure(result)) {
          toast.error(result.error)
          return
        }
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
    <div className="min-w-0 space-y-6">
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

      <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-card">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '36%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '72px' }} />
          </colgroup>
          <thead className="border-b border-border bg-background">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold sm:px-4 sm:text-sm">User</th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold sm:text-sm">Tier</th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold sm:text-sm">KYC</th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold sm:text-sm">2FA</th>
              <th className="px-2 py-2.5 text-left text-xs font-semibold sm:text-sm">Status</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-left text-xs font-semibold sm:text-sm">
                Joined
              </th>
              <th className="px-2 py-2.5 text-right text-xs font-semibold sm:px-3 sm:text-sm">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
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
                const isSelf = currentAdminUserId === user.id
                return (
                  <tr key={user.id} className="hover:bg-background">
                    <td className="overflow-hidden px-3 py-3 sm:px-4">
                      <AdminUserIdentityCell user={user} />
                    </td>
                    <td className="overflow-hidden px-2 py-3">
                      <CustomSelect
                        value={user.investor_tier ?? 'Starter'}
                        disabled={pending || isSelf}
                        onValueChange={(tier) => handleTierChange(user.id, tier)}
                        size="sm"
                        options={TIERS.map((tier) => ({ value: tier, label: tier }))}
                        placeholder="Tier"
                        className="w-full min-w-0"
                        triggerClassName="px-2"
                      />
                    </td>
                    <td className="overflow-hidden px-2 py-3">
                      <CustomSelect
                        value={normalizeKycStatus(user.kyc_status)}
                        disabled={pending || kycPending}
                        onValueChange={(status) => changeKycStatus(user.id, user.kyc_status, status)}
                        size="sm"
                        options={[...KYC_STATUS_OPTIONS]}
                        placeholder="KYC"
                        className="w-full min-w-0"
                        triggerClassName="px-2"
                      />
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs',
                          mfa.className
                        )}
                      >
                        {mfa.label}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={cn(
                          'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:px-2.5 sm:py-1 sm:text-xs',
                          user.account_status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {user.account_status ?? 'active'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-xs text-muted-foreground sm:text-sm">
                      {formatJoinedDate(user.created_at)}
                    </td>
                    <td className="px-2 py-3 text-right sm:px-3">
                      <AdminUserActionsMenu
                        user={user}
                        pending={pending}
                        isSelf={isSelf}
                        onKycNote={() => handleKycNote(user.id)}
                        onNote={() => handleNote(user.id)}
                        onResetMfa={() => handleResetMfa(user.id, user.email)}
                        onRestoreMfa={() => handleRestoreMfa(user.id)}
                        onSuspend={() => handleSuspend(user.id)}
                      />
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
