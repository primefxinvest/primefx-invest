import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type { PaymentStatus } from './types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for payment operations.')
  }
  return db
}

export async function creditInvestorWallet(userId: string, amountUsd: number) {
  const db = getDb()
  const { data: wallet, error: walletError } = await db
    .from('wallet_balances')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    throw new Error(walletError?.message ?? 'Wallet not found.')
  }

  const available = Number(wallet.available_balance ?? 0) + amountUsd
  const total = Number(wallet.total_balance ?? 0) + amountUsd

  const { error: updateError } = await db
    .from('wallet_balances')
    .update({
      available_balance: available,
      total_balance: total,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) throw new Error(updateError.message)
}

export async function debitInvestorWallet(userId: string, amountUsd: number) {
  const db = getDb()
  const { data: wallet, error: walletError } = await db
    .from('wallet_balances')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) {
    throw new Error(walletError?.message ?? 'Wallet not found.')
  }

  const available = Number(wallet.available_balance ?? 0)
  if (available < amountUsd) {
    throw new Error('Insufficient available balance.')
  }

  const nextAvailable = available - amountUsd
  const total = Math.max(0, Number(wallet.total_balance ?? 0) - amountUsd)

  const { error: updateError } = await db
    .from('wallet_balances')
    .update({
      available_balance: nextAvailable,
      total_balance: total,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) throw new Error(updateError.message)
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

function normalizeTxType(type: string | null | undefined) {
  return String(type ?? '').toLowerCase()
}

function transactionAmount(tx: { amount?: unknown }) {
  return Math.abs(Number(tx.amount ?? 0))
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
      const payment = await getPaymentByOrderId(tx.reference_id)
      if (payment) {
        await updatePaymentStatus(tx.reference_id, 'completed')
        return
      }
    }

    await debitInvestorWallet(userId, amount)
    return
  }

  if (type === 'bonus' || type === 'profit' || type === 'referral') {
    await creditInvestorWallet(userId, amount)
  }
}

/** Reverse or skip wallet holds when an admin rejects a pending transaction. */
export async function settleRejectedTransaction(tx: {
  user_id: string
  type: string
  amount: unknown
  reference_id?: string | null
}) {
  const type = normalizeTxType(tx.type)
  const amount = transactionAmount(tx)
  const userId = String(tx.user_id)

  if (amount <= 0) return

  if (type === 'withdrawal') {
    if (tx.reference_id) {
      const payment = await getPaymentByOrderId(tx.reference_id)
      if (payment) {
        await creditInvestorWallet(userId, amount)
        await updatePaymentStatus(tx.reference_id, 'failed')
        return
      }
    }
    return
  }

  if (type === 'deposit' && tx.reference_id) {
    const payment = await getPaymentByOrderId(tx.reference_id)
    if (payment) {
      await updatePaymentStatus(tx.reference_id, 'failed')
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
