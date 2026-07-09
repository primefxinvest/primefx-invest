import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { logFinancialAudit } from '@/lib/payments/financial-audit'
import type { PaymentStatus } from './types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for payment operations.')
  }
  return db
}

async function rpcWalletOp(
  fn: 'atomic_credit_wallet' | 'atomic_debit_wallet' | 'atomic_hold_wallet_funds' | 'atomic_release_wallet_hold' | 'atomic_restore_wallet_hold',
  userId: string,
  amountUsd: number,
  auditEvent: Parameters<typeof logFinancialAudit>[0]['eventType']
) {
  const db = getDb()
  const { error } = await db.rpc(fn, {
    p_user_id: userId,
    p_amount: amountUsd,
  })

  if (error) {
    console.error(`[Wallet] RPC ${fn} failed:`, error.message)
    throw new Error(error.message)
  }

  await logFinancialAudit({
    eventType: auditEvent,
    userId,
    amountUsd,
  })
}

export async function creditInvestorWallet(userId: string, amountUsd: number) {
  await rpcWalletOp('atomic_credit_wallet', userId, amountUsd, 'wallet.credit')
}

export async function debitInvestorWallet(userId: string, amountUsd: number) {
  await rpcWalletOp('atomic_debit_wallet', userId, amountUsd, 'wallet.debit')
}

export async function holdWalletFunds(userId: string, amountUsd: number) {
  await rpcWalletOp('atomic_hold_wallet_funds', userId, amountUsd, 'wallet.hold')
}

export async function releaseWalletHold(userId: string, amountUsd: number) {
  await rpcWalletOp('atomic_release_wallet_hold', userId, amountUsd, 'wallet.release_hold')
}

export async function restoreWalletHold(userId: string, amountUsd: number) {
  await rpcWalletOp('atomic_restore_wallet_hold', userId, amountUsd, 'wallet.restore_hold')
}

export async function recordDepositPayment(input: {
  userId: string
  provider: 'binance_pay' | 'now_payments'
  orderId: string
  amount: number
  currency: string
  providerPaymentId: string
  metadata: Record<string, unknown>
}) {
  const transactionId = await createPendingTransaction({
    userId: input.userId,
    type: 'deposit',
    amount: input.amount,
    description: `Deposit via ${input.provider === 'binance_pay' ? 'Binance Pay' : 'NOWPayments'} (${input.currency})`,
    referenceId: input.orderId,
  })

  const db = getDb()
  const { data, error } = await db
    .from('payments')
    .insert({
      investor_id: input.userId,
      provider: input.provider,
      order_id: input.orderId,
      type: 'deposit',
      status: 'pending',
      amount_usd: input.amount,
      pay_currency: input.currency.toUpperCase(),
      provider_payment_id: input.providerPaymentId,
      transaction_id: transactionId,
      metadata: input.metadata,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create payment record.')
  return { paymentId: data.id as string, transactionId }
}

export async function recordWithdrawalPayment(input: {
  userId: string
  orderId: string
  amount: number
  currency: string
  address: string
  providerPaymentId: string
  metadata?: Record<string, unknown>
}) {
  await debitInvestorWallet(input.userId, input.amount)

  try {
    const transactionId = await createPendingTransaction({
      userId: input.userId,
      type: 'withdrawal',
      amount: input.amount,
      description: `Withdrawal to ${input.currency} wallet`,
      referenceId: input.orderId,
    })

    const db = getDb()
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
        metadata: { currency: input.currency, address: input.address, ...input.metadata },
      })
      .select('id')
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Failed to create withdrawal record.')
    return { paymentId: data.id as string, transactionId }
  } catch (err) {
    await creditInvestorWallet(input.userId, input.amount)
    throw err
  }
}

export async function assertSufficientBalance(userId: string, amountUsd: number) {
  const db = getDb()
  const { data: wallet, error } = await db
    .from('wallet_balances')
    .select('available_balance')
    .eq('user_id', userId)
    .single()

  if (error || !wallet) {
    throw new Error(error?.message ?? 'Wallet not found.')
  }

  if (Number(wallet.available_balance ?? 0) < amountUsd) {
    throw new Error('Insufficient available balance.')
  }
}

export async function createPendingTransaction(input: {
  userId: string
  type: 'deposit' | 'withdrawal'
  amount: number
  description: string
  referenceId: string
}) {
  const db = getDb()
  const { data, error } = await db
    .from('transactions')
    .insert({
      user_id: input.userId,
      type: input.type,
      amount: input.amount,
      status: 'Pending',
      description: input.description,
      reference_id: input.referenceId,
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id as string
}

export async function completeTransaction(referenceId: string, status: 'Completed' | 'Failed' | 'Cancelled') {
  const db = getDb()
  const { error } = await db
    .from('transactions')
    .update({ status })
    .eq('reference_id', referenceId)

  if (error) throw new Error(error.message)
}

/** Update pending transaction copy while polling payment providers. */
export async function updateTransactionSyncNote(referenceId: string, description: string) {
  const db = getDb()
  const { error } = await db
    .from('transactions')
    .update({ description })
    .eq('reference_id', referenceId)
    .eq('status', 'Pending')

  if (error) throw new Error(error.message)
}

export async function updatePaymentStatus(
  orderId: string,
  status: PaymentStatus,
  patch: Record<string, unknown> = {}
) {
  const db = getDb()
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    ...patch,
  }

  if (status === 'completed') {
    updates.completed_at = new Date().toISOString()
  }

  const { data, error } = await db
    .from('payments')
    .update(updates)
    .eq('order_id', orderId)
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getPaymentByOrderId(orderId: string) {
  const db = getDb()
  const { data, error } = await db.from('payments').select('*').eq('order_id', orderId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Atomically claim deposit completion — returns payment row only on first claim. */
export async function claimDepositCompletion(orderId: string) {
  const db = getDb()
  const { data, error } = await db.rpc('claim_deposit_completion', {
    p_order_id: orderId,
  })

  if (error) throw new Error(error.message)
  return data as Record<string, unknown> | null
}

function normalizeTxType(type: string | null | undefined) {
  return String(type ?? '').toLowerCase()
}

function transactionAmount(tx: { amount?: unknown }) {
  return Math.abs(Number(tx.amount ?? 0))
}

const ACTIVE_WITHDRAWAL_REQUEST_STATUSES = ['pending_notice', 'ready', 'approved', 'processing'] as const

async function getWalletPendingBalance(userId: string) {
  const db = getDb()
  const { data: wallet, error } = await db
    .from('wallet_balances')
    .select('pending_balance')
    .eq('user_id', userId)
    .single()

  if (error || !wallet) {
    throw new Error(error?.message ?? 'Wallet not found.')
  }

  return Number(wallet.pending_balance ?? 0)
}

/** Return held withdrawal funds to available balance and cancel the linked request. */
async function cancelWalletWithdrawalRequest(referenceId: string, userId: string, amount: number) {
  const db = getDb()
  const { data: request } = await db
    .from('withdrawal_requests')
    .select('id, status, amount_usd')
    .eq('reference_id', referenceId)
    .maybeSingle()

  if (!request) return false

  const status = String(request.status ?? '').toLowerCase()
  if (!ACTIVE_WITHDRAWAL_REQUEST_STATUSES.includes(status as (typeof ACTIVE_WITHDRAWAL_REQUEST_STATUSES)[number])) {
    return false
  }

  const requestAmount = Number(request.amount_usd ?? amount)
  await restoreWalletHold(userId, requestAmount)

  await db
    .from('withdrawal_requests')
    .update({
      status: 'cancelled',
      processed_at: new Date().toISOString(),
    })
    .eq('id', request.id)

  return true
}

/** Cancel a pending investment capital withdrawal — funds remain in the investment. */
async function cancelInvestmentCapitalWithdrawalRequest(referenceId: string) {
  const db = getDb()
  const { data: request } = await db
    .from('investment_withdrawal_requests')
    .select('id, status')
    .eq('reference_id', referenceId)
    .maybeSingle()

  if (!request) return false

  const status = String(request.status ?? '').toLowerCase()
  if (!ACTIVE_WITHDRAWAL_REQUEST_STATUSES.includes(status as (typeof ACTIVE_WITHDRAWAL_REQUEST_STATUSES)[number])) {
    return false
  }

  await db
    .from('investment_withdrawal_requests')
    .update({
      status: 'cancelled',
      processed_at: new Date().toISOString(),
    })
    .eq('id', request.id)

  return true
}

/**
 * Return rejected withdrawal funds to the wallet.
 * Prefers restoring a pending hold; falls back to crediting available balance
 * when funds were already debited (legacy payment flow).
 */
export async function reverseRejectedWithdrawal(input: {
  userId: string
  amount: number
  referenceId?: string | null
}) {
  const { userId, amount, referenceId } = input
  if (amount <= 0) return

  if (referenceId) {
    const cancelled = await cancelWalletWithdrawalRequest(referenceId, userId, amount)
    if (cancelled) return

    const payment = await getPaymentByOrderId(referenceId)
    if (payment) {
      await creditInvestorWallet(userId, amount)
      await updatePaymentStatus(referenceId, 'failed')
      return
    }
  }

  const pending = await getWalletPendingBalance(userId)
  if (pending >= amount) {
    await restoreWalletHold(userId, amount)
    return
  }

  await creditInvestorWallet(userId, amount)
}

/** Return funds after an external payout fails once the notice period has already settled. */
export async function reverseFailedWithdrawalPayout(input: {
  userId: string
  amount: number
  referenceId: string
}) {
  const { userId, amount, referenceId } = input
  if (amount <= 0) return

  const db = getDb()
  const { data: request } = await db
    .from('withdrawal_requests')
    .select('id, status, amount_usd')
    .eq('reference_id', referenceId)
    .maybeSingle()

  const requestAmount = Number(request?.amount_usd ?? amount)

  if (request) {
    const status = String(request.status ?? '').toLowerCase()
    if (ACTIVE_WITHDRAWAL_REQUEST_STATUSES.includes(status as (typeof ACTIVE_WITHDRAWAL_REQUEST_STATUSES)[number])) {
      await restoreWalletHold(userId, requestAmount)
    } else {
      await creditInvestorWallet(userId, requestAmount)
    }

    await db
      .from('withdrawal_requests')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
    return
  }

  const payment = await getPaymentByOrderId(referenceId)
  if (payment) {
    await creditInvestorWallet(userId, Number(payment.amount_usd ?? amount))
    await updatePaymentStatus(referenceId, 'failed')
    return
  }

  await creditInvestorWallet(userId, amount)
}

/** Apply wallet balance changes when an admin approves a pending transaction. */
export async function settleApprovedTransaction(tx: {
  user_id: string
  type: string
  amount: unknown
  reference_id?: string | null
}) {
  const type = normalizeTxType(tx.type)
  const amount = transactionAmount(tx)
  const userId = String(tx.user_id)

  if (amount <= 0) return

  if (type === 'deposit') {
    if (tx.reference_id) {
      const payment = await getPaymentByOrderId(tx.reference_id)
      if (payment?.status === 'completed') {
        return
      }
      await creditInvestorWallet(userId, amount)
      if (payment) {
        await updatePaymentStatus(tx.reference_id, 'completed')
      }
      return
    }

    await creditInvestorWallet(userId, amount)
    return
  }

  if (type === 'withdrawal') {
    if (tx.reference_id) {
      const db = getDb()
      const { data: request } = await db
        .from('withdrawal_requests')
        .select('id, status, amount_usd, available_at')
        .eq('reference_id', tx.reference_id)
        .maybeSingle()

      if (request) {
        const requestStatus = String(request.status ?? '').toLowerCase()

        if (requestStatus === 'pending_notice') {
          throw new Error(
            'Withdrawal is still under the 7-day security hold. Approval is not available yet.'
          )
        }

        if (requestStatus === 'ready') {
          const { executeWithdrawalPayoutAfterApproval } = await import(
            '@/lib/payments/withdrawal-payout'
          )
          await executeWithdrawalPayoutAfterApproval(String(request.id))
          return
        }

        if (['approved', 'processing', 'completed'].includes(requestStatus)) {
          const payment = await getPaymentByOrderId(tx.reference_id)
          if (payment && payment.status !== 'completed') {
            await updatePaymentStatus(tx.reference_id, 'completed')
          }
          return
        }
      }

      const payment = await getPaymentByOrderId(tx.reference_id)
      if (payment) {
        await updatePaymentStatus(tx.reference_id, 'completed')
        return
      }
    }

    await debitInvestorWallet(userId, amount)
    return
  }

  if (type === 'bonus' || type === 'profit' || type === 'investment_profit' || type === 'referral') {
    await creditInvestorWallet(userId, amount)
  }
}

/** Reverse wallet / investment effects when an admin rejects a pending transaction. */
export async function settleRejectedTransaction(tx: {
  user_id: string
  type: string
  amount: unknown
  reference_id?: string | null
}) {
  const type = normalizeTxType(tx.type)
  const amount = transactionAmount(tx)
  const userId = String(tx.user_id)
  const referenceId = tx.reference_id ?? null

  if (amount <= 0) return

  if (type === 'withdrawal') {
    await reverseRejectedWithdrawal({ userId, amount, referenceId })
    return
  }

  if (type === 'investment' && referenceId) {
    await cancelInvestmentCapitalWithdrawalRequest(referenceId)
    return
  }

  if (type === 'deposit' && referenceId) {
    const payment = await getPaymentByOrderId(referenceId)
    if (payment) {
      await updatePaymentStatus(referenceId, 'failed')
    }
  }
}

export async function logPaymentWebhook(input: {
  provider: string
  paymentId?: string
  eventType?: string
  payload: Record<string, unknown>
  signatureValid: boolean
  processed: boolean
  errorMessage?: string
}) {
  const db = getDb()
  await db.from('payment_webhook_logs').insert({
    provider: input.provider,
    payment_id: input.paymentId ?? null,
    event_type: input.eventType ?? null,
    payload: input.payload,
    signature_valid: input.signatureValid,
    processed: input.processed,
    error_message: input.errorMessage ?? null,
  })
}
