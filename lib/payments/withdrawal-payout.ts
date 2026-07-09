import 'server-only'

import { createNowPaymentsPayout } from '@/lib/payments/nowpayments'
import { isProviderConfigured } from '@/lib/payments/env'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import {
  completeTransaction,
  createPendingTransaction,
  getPaymentByOrderId,
  releaseWalletHold,
  restoreWalletHold,
} from '@/lib/payments/wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  claimWithdrawalForProcessing,
  markWithdrawalRequestStatus,
} from '@/lib/wallet/withdrawals'
import { canAdminApproveWithdrawal } from '@/lib/wallet/withdrawal-status'
import {
  notifyWithdrawalApproved,
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

function isCryptoWithdrawal(row: Record<string, unknown>) {
  return (
    String(row.provider ?? '') === 'now_payments' &&
    typeof row.payout_address === 'string' &&
    row.payout_address.length > 0 &&
    typeof row.currency === 'string' &&
    row.currency.length > 0
  )
}

async function recordProcessingWithdrawalPayment(input: {
  userId: string
  orderId: string
  amount: number
  netAmount: number
  currency: string
  address: string
  providerPaymentId: string
  transactionId?: string
}) {
  const db = getDb()

  const existingPayment = await getPaymentByOrderId(input.orderId)
  if (existingPayment) {
    return {
      paymentId: String(existingPayment.id),
      transactionId: String(existingPayment.transaction_id ?? input.transactionId ?? ''),
    }
  }

  const transactionId =
    input.transactionId ??
    (await createPendingTransaction({
      userId: input.userId,
      type: 'withdrawal',
      amount: input.amount,
      description: `Crypto withdrawal payout in progress (${input.currency.toUpperCase()})`,
      referenceId: input.orderId,
    }))

  const { data, error } = await db
    .from('payments')
    .insert({
      investor_id: input.userId,
      provider: 'now_payments',
      order_id: input.orderId,
      type: 'withdrawal',
      status: 'processing',
      amount_usd: input.amount,
      pay_currency: input.currency.toUpperCase(),
      pay_address: input.address,
      provider_payment_id: input.providerPaymentId,
      transaction_id: transactionId,
      metadata: {
        currency: input.currency,
        address: input.address,
        net_amount_usd: input.netAmount,
        payout_initiated_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to record withdrawal payment.')
  }

  return { paymentId: data.id as string, transactionId }
}

export function assertWithdrawalRequestApprovable(row: Record<string, unknown>, now = new Date()) {
  if (!canAdminApproveWithdrawal({
    status: String(row.status ?? ''),
    availableAt: row.available_at as string | null,
    now,
  })) {
    const status = String(row.status ?? '').toLowerCase()
    if (status === 'pending_notice') {
      throw new Error('Withdrawal is still under the 7-day security hold. Approval is not available yet.')
    }
    throw new Error('Only withdrawals in Ready for Payout status can be approved.')
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

async function claimWithdrawalForApproval(requestId: string) {
  const db = getDb()
  const now = new Date().toISOString()

  const { data, error } = await db
    .from('withdrawal_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)
    .eq('status', 'ready')
    .lte('available_at', now)
    .select('*')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data as Record<string, unknown> | null
}

/** Admin approval: ready → approved → payout (crypto) or manual completion. */
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
  if (['processing', 'completed'].includes(existingStatus)) {
    throw new Error('Withdrawal has already been processed.')
  }

  const referenceId = String(existing.reference_id)
  const existingPayment = await getPaymentByOrderId(referenceId)
  if (
    existingPayment &&
    ['processing', 'completed'].includes(String(existingPayment.status ?? '').toLowerCase())
  ) {
    throw new Error('Payout has already been initiated for this withdrawal.')
  }

  const canRetryApproved =
    existingStatus === 'approved' &&
    Boolean((existing.metadata as Record<string, unknown> | null)?.payout_error)

  if (!canRetryApproved) {
    assertWithdrawalRequestApprovable(existing as Record<string, unknown>)
  }

  if (existingStatus === 'approved' && !canRetryApproved) {
    throw new Error('Withdrawal is already approved and awaiting payout.')
  }

  const claimed =
    existingStatus === 'approved' && canRetryApproved
      ? (existing as Record<string, unknown>)
      : await claimWithdrawalForApproval(requestId)

  if (!claimed) {
    throw new Error('Withdrawal could not be approved. It may have already been processed.')
  }

  const userId = String(claimed.user_id)
  const gross = Number(claimed.amount_usd)
  const netAmount = Number(claimed.net_amount_usd ?? gross)

  await notifyWithdrawalApproved(userId, gross, referenceId)

  await logFinancialAudit({
    eventType: 'withdrawal.approved',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { provider: claimed.provider },
  })

  if (isCryptoWithdrawal(claimed)) {
    if (!isProviderConfigured('now_payments')) {
      await markWithdrawalRequestStatus(requestId, 'approved', {
        metadata: {
          ...(claimed.metadata as Record<string, unknown>),
          payout_error: 'NOWPayments is not configured.',
        },
      })
      throw new Error('NOWPayments is not configured. Withdrawal approved but payout deferred.')
    }

    try {
      await releaseWalletHold(userId, gross)

      const payout = await createNowPaymentsPayout({
        address: String(claimed.payout_address),
        currency: String(claimed.currency),
        amount: netAmount,
        extraId: referenceId,
      })

      const providerPaymentId = String(payout.id ?? referenceId)

      const { data: existingTx } = await db
        .from('transactions')
        .select('id')
        .eq('reference_id', referenceId)
        .maybeSingle()

      await recordProcessingWithdrawalPayment({
        userId,
        orderId: referenceId,
        amount: gross,
        netAmount,
        currency: String(claimed.currency),
        address: String(claimed.payout_address),
        providerPaymentId,
        transactionId: existingTx?.id as string | undefined,
      })

      await markWithdrawalRequestStatus(requestId, 'processing', {
        metadata: {
          ...(claimed.metadata as Record<string, unknown>),
          provider_payment_id: providerPaymentId,
          payout_initiated_at: new Date().toISOString(),
        },
      })

      await logFinancialAudit({
        eventType: 'withdrawal.payout_initiated',
        userId,
        referenceId,
        amountUsd: netAmount,
        metadata: { providerPaymentId, currency: claimed.currency },
      })

      return { status: 'payout_initiated' as const, referenceId, providerPaymentId }
    } catch (err) {
      await restoreWalletHold(userId, gross)
      await markWithdrawalRequestStatus(requestId, 'approved', {
        metadata: {
          ...(claimed.metadata as Record<string, unknown>),
          payout_error: err instanceof Error ? err.message : 'Payout initiation failed',
        },
      })

      await logFinancialAudit({
        eventType: 'withdrawal.failed',
        userId,
        referenceId,
        amountUsd: gross,
        metadata: {
          stage: 'payout_initiation',
          error: err instanceof Error ? err.message : 'unknown',
        },
      })

      throw err
    }
  }

  await releaseWalletHold(userId, gross)

  await markWithdrawalRequestStatus(requestId, 'completed')
  await completeTransaction(referenceId, 'Completed')

  const { notifyWithdrawalCompleted } = await import('@/lib/notifications/service')
  await notifyWithdrawalCompleted(userId, gross, referenceId)

  await logFinancialAudit({
    eventType: 'withdrawal.completed',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { source: 'admin_approval', manual: true },
  })

  return { status: 'completed' as const, referenceId }
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
  const rejectable = ['pending_notice', 'ready', 'approved'].includes(status)

  if (!rejectable) {
    throw new Error('This withdrawal can no longer be rejected.')
  }

  const userId = String(request.user_id)
  const gross = Number(request.amount_usd)
  const referenceId = String(request.reference_id)

  const { data: cancelled, error } = await db
    .from('withdrawal_requests')
    .update({
      status: 'cancelled',
      processed_at: new Date().toISOString(),
      metadata: {
        ...(request.metadata as Record<string, unknown>),
        rejection_reason: reason ?? null,
        rejected_at: new Date().toISOString(),
      },
    })
    .eq('id', requestId)
    .in('status', ['pending_notice', 'ready', 'approved'])
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
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
