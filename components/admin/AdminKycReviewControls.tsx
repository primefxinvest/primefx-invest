'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'
import { addKycReviewNote, updateUserKycStatus } from '@/lib/admin/actions'
import { KYC_STATUS_OPTIONS, normalizeKycStatus } from '@/lib/hooks/useKycStatusChange'
import { CustomSelect } from '@/components/ui/custom-select'
import { Button } from '@/components/ui/button'

type AdminKycReviewControlsProps = {
  userId: string
  kycStatus: string | null | undefined
  kycRejectionReason?: string | null
}

export function AdminKycReviewControls({
  userId,
  kycStatus,
  kycRejectionReason,
}: AdminKycReviewControlsProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(normalizeKycStatus(kycStatus))
  const [reason, setReason] = useState(kycRejectionReason ?? '')
  const [comment, setComment] = useState('')
  const [noteOnly, setNoteOnly] = useState('')

  useEffect(() => {
    setStatus(normalizeKycStatus(kycStatus))
    setReason(kycRejectionReason ?? '')
  }, [kycStatus, kycRejectionReason])

  const handleUpdateStatus = () => {
    if (status === 'Rejected' && !reason.trim()) {
      toast.error('Rejection reason is required when setting KYC to Rejected.')
      return
    }

    startTransition(async () => {
      try {
        await updateUserKycStatus(
          userId,
          status,
          status === 'Rejected' ? reason.trim() : undefined,
          comment.trim() || undefined
        )
        toast.success(`KYC status updated to ${status}`)
        setComment('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update KYC status')
      }
    })
  }

  const handleAddNote = () => {
    const trimmed = noteOnly.trim()
    if (!trimmed) {
      toast.error('Enter a KYC review comment first.')
      return
    }

    startTransition(async () => {
      try {
        await addKycReviewNote(userId, trimmed)
        toast.success('KYC review note added')
        setNoteOnly('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to add KYC note')
      }
    })
  }

  return (
    <div className="mt-6 space-y-5 rounded-lg border border-border bg-background p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">KYC review actions</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          Change verification status and leave internal review comments for compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
            KYC status
          </label>
          <CustomSelect
            value={status}
            disabled={pending}
            onValueChange={(value) => setStatus(normalizeKycStatus(value))}
            options={[...KYC_STATUS_OPTIONS]}
            placeholder="Status"
            className="w-full"
          />
        </div>

        {status === 'Rejected' ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rejection reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={pending}
              placeholder="e.g. Blurry document, name mismatch"
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Review comment
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={pending}
          rows={3}
          placeholder="Optional note saved with this status change..."
          className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Button type="button" disabled={pending} onClick={handleUpdateStatus}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update KYC status'}
      </Button>

      <div className="border-t border-border pt-5">
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Add KYC comment only
        </label>
        <textarea
          value={noteOnly}
          onChange={(e) => setNoteOnly(e.target.value)}
          disabled={pending}
          rows={2}
          placeholder="Internal KYC note without changing status..."
          className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={handleAddNote}
          className="mt-3"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Add KYC comment
        </Button>
      </div>
    </div>
  )
}
