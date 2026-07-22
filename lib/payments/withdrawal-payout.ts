import 'server-only'

import { logFinancialAudit } from '@/lib/payments/financial-audit'
import {
  completeTransaction,
  releaseWalletHold,
  restoreWalletHold,
} from '@/lib/payments/wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  claimWithdrawalForProcessing,
  claimWithdrawalStatusTransition,
} from '@/lib/wallet/withdrawals'
import { canAdminApproveWithdrawal } from '@/lib/wallet/withdrawal-status'
import {
  notifyWithdrawalApproved,
  notifyWithdrawalCompleted,
  notifyWithdrawalReadyForPayout,
  notifyWithdrawalRejected,
} from '@/lib/notifications/service'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for withdrawal payouts.')
  }
  return db
}

export function assertWithdrawalRequestApprovable(row: Record<string, unknown>, now = new Date()) {
  if (
    !canAdminApproveWithdrawal({
      status: String(row.status ?? ''),
      availableAt: row.available_at as string | null,
      now,
    })
  ) {
    const status = String(row.status ?? '').toLowerCase()
    if (status === 'pending_notice') {
      throw new Error(
        'Withdrawal is still under the 7-day security hold. Unlock or wait until the hold expires.'
      )
    }
    if (status === 'approved' || status === 'processing') {
      throw new Error('Withdrawal is already approved. Use Mark as Paid to complete it.')
    }
    if (status === 'completed') {
      throw new Error('Withdrawal has already been paid.')
    }
    throw new Error('Only pending withdrawals can be approved.')
  }
}

/** Cron job: promote due withdrawals from pending_notice to ready (no payout). */
export async function promoteDueWithdrawalToReady(row: Record<string, unknown>) {
  const requestId = row.id as string
  const userId = row.user_id as string
  const gross = Number(row.amount_usd)
  const referenceId = row.reference_id as string

  const claimed = await claimWithdrawalForProcessing(requestId, 'ready')
  if (!claimed) {
    return { status: 'skipped' as const, referenceId, reason: 'already_claimed' }
  }

  await logFinancialAudit({
    eventType: 'withdrawal.ready',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { method: claimed.method_label, automated: true },
  })

  await notifyWithdrawalReadyForPayout(userId, gross, referenceId)

  return { status: 'ready_for_payout' as const, referenceId }
}

/** @deprecated Use promoteDueWithdrawalToReady — kept for cron import compatibility. */
export async function processDueWithdrawalRow(row: Record<string, unknown>) {
  return promoteDueWithdrawalToReady(row)
}

/** Admin approval only: pending/ready → approved (no payout yet). */
export async function executeWithdrawalPayoutAfterApproval(requestId: string) {
  const db = getDb()

  const { data: existing } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (!existing) {
    throw new Error('Withdrawal request not found.')
  }

  const existingStatus = String(existing.status ?? '').toLowerCase()
  if (['approved', 'processing', 'completed'].includes(existingStatus)) {
    throw new Error('Withdrawal has already been approved or completed.')
  }

  assertWithdrawalRequestApprovable(existing as Record<string, unknown>)

  const claimed = await claimWithdrawalStatusTransition({
    requestId,
    fromStatuses: ['pending', 'ready'],
    toStatus: 'approved',
    extra: {
      metadata: {
        approved_at: new Date().toISOString(),
      },
    },
  })

  if (!claimed) {
    throw new Error('Withdrawal could not be approved. It may have already been processed.')
  }

  const userId = String(claimed.user_id)
  const gross = Number(claimed.amount_usd)
  const referenceId = String(claimed.reference_id)

  await notifyWithdrawalApproved(userId, gross, referenceId)

  await logFinancialAudit({
    eventType: 'withdrawal.approved',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { provider: claimed.provider },
  })

  return { status: 'approved' as const, referenceId }
}

/** Admin mark as paid: approved → completed, release reserved funds. */
export async function markWithdrawalAsPaid(
  requestId: string,
  input?: {
    txHash?: string
    notes?: string
    processedBy?: string
  }
) {
  const db = getDb()

  const { data: existing } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (!existing) {
    throw new Error('Withdrawal request not found.')
  }

  const existingStatus = String(existing.status ?? '').toLowerCase()
  if (existingStatus === 'completed') {
    throw new Error('Withdrawal has already been marked as paid.')
  }
  if (!['approved', 'processing'].includes(existingStatus)) {
    throw new Error('Only approved withdrawals can be marked as paid.')
  }

  const userId = String(existing.user_id)
  const gross = Number(existing.amount_usd)
  const referenceId = String(existing.reference_id)
  const txHash = input?.txHash?.trim() || null
  const notes = input?.notes?.trim() || null

  const claimed = await claimWithdrawalStatusTransition({
    requestId,
    fromStatuses: ['approved', 'processing'],
    toStatus: 'completed',
    extra: {
      processed_by: input?.processedBy ?? null,
      tx_hash: txHash,
      notes,
      metadata: {
        ...(existing.metadata as Record<string, unknown>),
        tx_hash: txHash,
        admin_notes: notes,
        completed_at: new Date().toISOString(),
        marked_paid_by: input?.processedBy ?? null,
      },
    },
  })

  if (!claimed) {
    throw new Error('Withdrawal could not be marked as paid. It may have already been processed.')
  }

  await releaseWalletHold(userId, gross)
  await completeTransaction(referenceId, 'Completed')

  await notifyWithdrawalCompleted(userId, gross, referenceId)

  await logFinancialAudit({
    eventType: 'withdrawal.completed',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { source: 'admin_mark_paid', txHash, notes },
  })

  return { status: 'completed' as const, referenceId, txHash }
}

/** Admin rejection: restore reserved funds and cancel the request. */
export async function rejectWithdrawalRequest(requestId: string, reason?: string) {
  const db = getDb()

  const { data: request } = await db
    .from('withdrawal_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (!request) {
    throw new Error('Withdrawal request not found.')
  }

  const status = String(request.status ?? '').toLowerCase()
  const rejectable = ['pending', 'pending_notice', 'ready', 'approved'].includes(status)

  if (!rejectable) {
    throw new Error('This withdrawal can no longer be rejected.')
  }

  const userId = String(request.user_id)
  const gross = Number(request.amount_usd)
  const referenceId = String(request.reference_id)

  const cancelled = await claimWithdrawalStatusTransition({
    requestId,
    fromStatuses: ['pending', 'pending_notice', 'ready', 'approved'],
    toStatus: 'cancelled',
    extra: {
      metadata: {
        ...(request.metadata as Record<string, unknown>),
        rejection_reason: reason ?? null,
        rejected_at: new Date().toISOString(),
      },
    },
  })

  if (!cancelled) {
    throw new Error('Withdrawal could not be rejected. It may have already been processed.')
  }

  await restoreWalletHold(userId, gross)
  await completeTransaction(referenceId, 'Cancelled')

  await notifyWithdrawalRejected(userId, gross, referenceId)

  await logFinancialAudit({
    eventType: 'withdrawal.rejected',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { reason: reason ?? null },
  })

  return { success: true as const, referenceId }
}
