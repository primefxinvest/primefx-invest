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

/** Inserts a notification only when no row exists for the same user + dedupeKey. */
export async function createUserNotificationOnce(
  input: CreateNotificationInput & { dedupeKey: string }
) {
  const db = getDb()
  if (!db) return null

  const { data: existing } = await db
    .from('user_notifications')
    .select('id')
    .eq('user_id', input.userId)
    .filter('metadata->>dedupeKey', 'eq', input.dedupeKey)
    .limit(1)
    .maybeSingle()

  if (existing?.id) return existing.id as string

  return createUserNotification({
    ...input,
    metadata: { ...(input.metadata ?? {}), dedupeKey: input.dedupeKey },
  })
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

export async function notifyTransferCompleted(
  senderId: string,
  recipientId: string,
  amountUsd: number,
  referenceId: string
) {
  await createUserNotification({
    userId: senderId,
    title: 'Transfer sent',
    message: `You sent $${amountUsd.toFixed(2)} successfully.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'transfer_sent' },
  })

  await createUserNotification({
    userId: recipientId,
    title: 'Transfer received',
    message: `You received $${amountUsd.toFixed(2)} in your wallet.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'transfer_received' },
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

  return createUserNotificationOnce({
    userId,
    dedupeKey: `kyc_status:${status}`,
    title: status === 'Verified' ? 'KYC approved' : 'KYC rejected',
    message:
      status === 'Verified'
        ? 'Your identity verification is complete. You can now deposit, withdraw, and invest.'
        : 'Your identity verification was rejected. Please review your documents and contact support.',
    type: 'security',
    metadata: { status, event: 'kyc_status' },
  })
}

export async function notifySupportTicketReply(
  userId: string,
  ticketId: string,
  subject: string
) {
  return createUserNotification({
    userId,
    title: 'Support replied to your ticket',
    message: `Our team responded to "${subject}". Open Support to read the reply.`,
    type: 'general',
    metadata: { ticketId, event: 'support_ticket_reply' },
  })
}
