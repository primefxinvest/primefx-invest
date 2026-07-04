import 'server-only'

import { queryBinanceOrder } from './binance-pay'
import {
  isPaymentComplete,
  isPaymentFailed,
  listNowPaymentsPaymentsByOrderId,
} from './nowpayments'
import {
  completeDepositFromWebhook,
  failDepositFromWebhook,
} from './service'
import { getPaymentByOrderId, updatePaymentStatus } from './wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to sync deposits.')
  }
  return db
}

const OPEN_DEPOSIT_STATUSES = ['pending', 'confirming', 'processing'] as const

export type DepositSyncResult = {
  orderId: string
  status: 'completed' | 'failed' | 'pending' | 'skipped'
  message?: string
}

async function syncNowPaymentsDeposit(orderId: string): Promise<DepositSyncResult> {
  const payments = await listNowPaymentsPaymentsByOrderId(orderId)
  if (payments.length === 0) {
    return { orderId, status: 'pending', message: 'No NOWPayments payment found yet.' }
  }

  const latest = payments[0]
  const paymentStatus = String(latest.payment_status ?? '').toLowerCase()

  if (isPaymentComplete(paymentStatus)) {
    await completeDepositFromWebhook(orderId)
    return { orderId, status: 'completed' }
  }

  if (isPaymentFailed(paymentStatus)) {
    await failDepositFromWebhook(
      orderId,
      paymentStatus === 'expired' ? 'expired' : paymentStatus === 'refunded' ? 'refunded' : 'failed'
    )
    return { orderId, status: 'failed' }
  }

  if (['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid'].includes(paymentStatus)) {
    const mappedStatus =
      paymentStatus === 'waiting'
        ? 'pending'
        : paymentStatus === 'confirming' || paymentStatus === 'confirmed'
          ? 'confirming'
          : 'processing'

    await updatePaymentStatus(orderId, mappedStatus, {
      provider_payment_id: latest.payment_id != null ? String(latest.payment_id) : undefined,
      pay_amount: latest.pay_amount != null ? Number(latest.pay_amount) : undefined,
      metadata: latest,
    })
  }

  return { orderId, status: 'pending', message: `Payment status: ${paymentStatus || 'unknown'}` }
}

async function syncBinancePayDeposit(
  orderId: string,
  payment: Record<string, unknown>
): Promise<DepositSyncResult> {
  const metadata = (payment.metadata ?? {}) as Record<string, unknown>
  const prepayId =
    (typeof payment.provider_payment_id === 'string' ? payment.provider_payment_id : null) ??
    (typeof metadata.prepayId === 'string' ? metadata.prepayId : null)

  if (!prepayId) {
    return { orderId, status: 'pending', message: 'Missing Binance Pay prepay ID.' }
  }

  const order = await queryBinanceOrder(prepayId)
  const status = String(order.status ?? '').toUpperCase()

  if (status === 'PAID' || status === 'SUCCESS' || status === 'PAY_SUCCESS') {
    await completeDepositFromWebhook(orderId)
    return { orderId, status: 'completed' }
  }

  if (['CANCELED', 'CANCELLED', 'EXPIRED', 'ERROR', 'FAIL'].includes(status)) {
    await failDepositFromWebhook(
      orderId,
      status === 'EXPIRED' ? 'expired' : status.includes('CANCEL') ? 'cancelled' : 'failed'
    )
    return { orderId, status: 'failed' }
  }

  return { orderId, status: 'pending', message: `Binance Pay status: ${status || 'unknown'}` }
}

export async function syncDepositByOrderId(
  orderId: string,
  userId?: string
): Promise<DepositSyncResult> {
  const payment = await getPaymentByOrderId(orderId)
  if (!payment) {
    return { orderId, status: 'skipped', message: 'Payment not found.' }
  }

  if (userId && String(payment.investor_id) !== userId) {
    return { orderId, status: 'skipped', message: 'Payment does not belong to this user.' }
  }

  if (payment.type !== 'deposit') {
    return { orderId, status: 'skipped', message: 'Not a deposit payment.' }
  }

  if (payment.status === 'completed') {
    return { orderId, status: 'skipped', message: 'Already completed.' }
  }

  if (payment.provider === 'now_payments') {
    return syncNowPaymentsDeposit(orderId)
  }

  if (payment.provider === 'binance_pay') {
    return syncBinancePayDeposit(orderId, payment as Record<string, unknown>)
  }

  return { orderId, status: 'skipped', message: 'Unsupported provider.' }
}

export async function syncUserPendingDeposits(userId: string) {
  const db = getDb()
  const { data: pending, error } = await db
    .from('payments')
    .select('order_id')
    .eq('investor_id', userId)
    .eq('type', 'deposit')
    .in('status', [...OPEN_DEPOSIT_STATUSES])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    throw new Error(error.message)
  }

  const results: DepositSyncResult[] = []
  for (const row of pending ?? []) {
    const orderId = String(row.order_id)
    try {
      results.push(await syncDepositByOrderId(orderId, userId))
    } catch (err) {
      results.push({
        orderId,
        status: 'pending',
        message: err instanceof Error ? err.message : 'Sync failed',
      })
    }
  }

  const completed = results.filter((item) => item.status === 'completed').length

  return {
    checked: results.length,
    completed,
    results,
  }
}
