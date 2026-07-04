import 'server-only'

import { createNowPaymentsPayout } from '@/lib/payments/nowpayments'
import { isProviderConfigured } from '@/lib/payments/env'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import {
  completeTransaction,
  createPendingTransaction,
  releaseWalletHold,
  restoreWalletHold,
} from '@/lib/payments/wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { claimWithdrawalForProcessing, markWithdrawalRequestStatus } from '@/lib/wallet/withdrawals'

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
}) {
  const db = getDb()

  const transactionId = await createPendingTransaction({
    userId: input.userId,
    type: 'withdrawal',
    amount: input.amount,
    description: `Crypto withdrawal payout in progress (${input.currency.toUpperCase()})`,
    referenceId: input.orderId,
  })

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

export async function processDueWithdrawalRow(row: Record<string, unknown>) {
  const requestId = row.id as string
  const userId = row.user_id as string
  const gross = Number(row.amount_usd)
  const netAmount = Number(row.net_amount_usd ?? gross)
  const referenceId = row.reference_id as string

  const claimed = await claimWithdrawalForProcessing(requestId, 'processing')
  if (!claimed) {
    return { status: 'skipped' as const, referenceId, reason: 'already_claimed' }
  }

  await logFinancialAudit({
    eventType: 'withdrawal.claimed',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { provider: claimed.provider },
  })

  if (isCryptoWithdrawal(claimed)) {
    if (!isProviderConfigured('now_payments')) {
      await markWithdrawalRequestStatus(requestId, 'ready', {
        metadata: {
          ...(claimed.metadata as Record<string, unknown>),
          payout_error: 'NOWPayments is not configured.',
        },
      })
      return { status: 'deferred' as const, referenceId, reason: 'provider_unconfigured' }
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

      await recordProcessingWithdrawalPayment({
        userId,
        orderId: referenceId,
        amount: gross,
        netAmount,
        currency: String(claimed.currency),
        address: String(claimed.payout_address),
        providerPaymentId,
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
      await markWithdrawalRequestStatus(requestId, 'failed', {
        metadata: {
          ...(claimed.metadata as Record<string, unknown>),
          payout_error: err instanceof Error ? err.message : 'Payout initiation failed',
        },
      })
      await completeTransaction(referenceId, 'Failed')

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

  await markWithdrawalRequestStatus(requestId, 'ready')

  await logFinancialAudit({
    eventType: 'withdrawal.ready',
    userId,
    referenceId,
    amountUsd: gross,
    metadata: { method: claimed.method_label, manual: true },
  })

  return { status: 'ready_for_manual_payout' as const, referenceId }
}
