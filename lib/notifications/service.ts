import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export type NotificationType = 'wallet' | 'investment' | 'security' | 'reward' | 'general'

export interface CreateNotificationInput {
  userId: string
  title: string
  message: string
  type?: NotificationType
  metadata?: Record<string, unknown>
}

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) return null
  return db
}

export async function createUserNotification(input: CreateNotificationInput) {
  const db = getDb()
  if (!db) return null

  const { data, error } = await db
    .from('user_notifications')
    .insert({
      user_id: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? 'general',
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single()

  if (error) {
    console.error('[notifications] create failed:', error.message)
    return null
  }

  return data.id as string
}

export async function notifyDepositCreated(userId: string, amountUsd: number, referenceId: string) {
  return createUserNotification({
    userId,
    title: 'Deposit initiated',
    message: `Your deposit of $${amountUsd.toFixed(2)} is pending confirmation.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'deposit_pending' },
  })
}

export async function notifyDepositCompleted(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Deposit confirmed',
    message: `$${amountUsd.toFixed(2)} has been credited to your wallet.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'deposit_completed' },
  })
}

export async function notifyDepositFailed(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Deposit failed',
    message: `Your deposit of $${amountUsd.toFixed(2)} could not be completed.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'deposit_failed' },
  })
}

export async function notifyWithdrawalSubmitted(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Withdrawal submitted',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} is being processed.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_pending' },
  })
}

export async function notifyWithdrawalCompleted(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Withdrawal completed',
    message: `$${amountUsd.toFixed(2)} has been sent to your payout address.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_completed' },
  })
}

export async function notifyInvestmentCreated(
  userId: string,
  planName: string,
  amountUsd: number,
  referenceId?: string
) {
  return createUserNotification({
    userId,
    title: 'Investment confirmed',
    message: `You invested $${amountUsd.toFixed(2)} in the ${planName} plan.`,
    type: 'investment',
    metadata: { planName, amountUsd, referenceId, event: 'investment_created' },
  })
}

export async function notifyKycStatusChange(userId: string, status: 'Verified' | 'Rejected' | 'Pending') {
  if (status === 'Pending') return null

  return createUserNotification({
    userId,
    title: status === 'Verified' ? 'KYC approved' : 'KYC rejected',
    message:
      status === 'Verified'
        ? 'Your identity verification is complete. You can now deposit, withdraw, and invest.'
        : 'Your identity verification was rejected. Please review your documents and contact support.',
    type: 'security',
    metadata: { status, event: 'kyc_status' },
  })
}
