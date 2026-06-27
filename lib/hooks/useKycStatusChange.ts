'use client'

import { useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { updateUserKycStatus } from '@/lib/admin/actions'
import { useActionDialog } from '@/lib/hooks/useActionDialog'

export const KYC_STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'Verified', label: 'Verified' },
  { value: 'Rejected', label: 'Rejected' },
] as const

export type KycStatusValue = (typeof KYC_STATUS_OPTIONS)[number]['value']

export function normalizeKycStatus(status: string | null | undefined): KycStatusValue {
  const lower = String(status ?? 'Pending').toLowerCase()
  if (lower === 'verified') return 'Verified'
  if (lower === 'rejected') return 'Rejected'
  return 'Pending'
}

export function useKycStatusChange() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const { prompt, confirm, ActionDialog } = useActionDialog()

  const changeKycStatus = useCallback(
    async (userId: string, currentStatus: string | null | undefined, newStatus: string) => {
      const normalizedCurrent = normalizeKycStatus(currentStatus)
      const normalizedNext = normalizeKycStatus(newStatus)
      if (normalizedNext === normalizedCurrent) return

      let reasonCode: string | undefined
      let comment: string | undefined

      if (normalizedNext === 'Rejected') {
        const reason = await prompt({
          title: 'Reject KYC',
          description: 'Provide a rejection reason visible to compliance and stored on the account.',
          label: 'Rejection reason',
          required: true,
          requiredMessage: 'KYC rejections must include a documented reason.',
          confirmLabel: 'Reject',
        })
        if (!reason) return

        reasonCode = reason
        const note = await prompt({
          title: 'KYC review comment',
          description: 'Optional internal note about this rejection.',
          label: 'Comment (optional)',
          required: false,
          confirmLabel: 'Continue',
        })
        comment = note ?? undefined
      } else if (normalizedNext === 'Verified') {
        const confirmed = await confirm({
          title: 'Approve KYC',
          description: 'Mark this user as KYC verified? They will be able to deposit, invest, and withdraw.',
          confirmLabel: 'Approve',
        })
        if (!confirmed) return

        const note = await prompt({
          title: 'KYC review comment',
          description: 'Optional internal note about this approval.',
          label: 'Comment (optional)',
          required: false,
          confirmLabel: 'Continue',
        })
        comment = note ?? undefined
      } else {
        const confirmed = await confirm({
          title: 'Reset KYC to Pending',
          description: 'Set KYC status back to Pending? Use this to reopen review or undo a decision.',
          confirmLabel: 'Reset to Pending',
        })
        if (!confirmed) return

        const note = await prompt({
          title: 'KYC review comment',
          description: 'Optional internal note about this status change.',
          label: 'Comment (optional)',
          required: false,
          confirmLabel: 'Continue',
        })
        comment = note ?? undefined
      }

      startTransition(async () => {
        try {
          await updateUserKycStatus(userId, normalizedNext, reasonCode, comment)
          toast.success(`KYC status updated to ${normalizedNext}`)
          router.refresh()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to update KYC status')
        }
      })
    },
    [confirm, prompt, router]
  )

  return {
    changeKycStatus,
    normalizeKycStatus,
    pending,
    ActionDialog,
  }
}
