import 'server-only'

import { queryBinanceOrder } from './binance-pay'
import { syncNowPaymentsDepositStatus } from './nowpayments-sync'
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
  providerStatus?: string | null
}

async function syncNowPaymentsDeposit(orderId: string): Promise<DepositSyncResult> {
  const result = await syncNowPaymentsDepositStatus(orderId)
  return {
    orderId: result.orderId,
    status: result.status,
    message: result.message,
    providerStatus: result.providerStatus,
  }
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
  const stillPending = results.filter((item) => item.status === 'pending').length

  return {
    checked: results.length,
    completed,
    stillPending,
    results,
  }
}

/** Reconcile open crypto deposits when webhooks were missed (cron / admin). */
export async function syncAllOpenDeposits(limit = 50) {
  const db = getDb()
  const { data: pending, error } = await db
    .from('payments')
    .select('order_id, investor_id')
    .eq('type', 'deposit')
    .in('status', [...OPEN_DEPOSIT_STATUSES])
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  const results: DepositSyncResult[] = []
  for (const row of pending ?? []) {
    const orderId = String(row.order_id)
    const userId = String(row.investor_id)
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

  return {
    checked: results.length,
    completed: results.filter((item) => item.status === 'completed').length,
    failed: results.filter((item) => item.status === 'failed').length,
    results,
  }
}
