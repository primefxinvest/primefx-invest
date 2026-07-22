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

export async function notifyDepositPartialCompleted(
  userId: string,
  creditedUsd: number,
  requestedUsd: number,
  referenceId?: string
) {
  return createUserNotification({
    userId,
    title: 'Partial deposit credited',
    message: `A partial payment was received. $${creditedUsd.toFixed(2)} of your $${requestedUsd.toFixed(2)} deposit has been credited to your wallet.`,
    type: 'wallet',
    metadata: {
      referenceId,
      creditedUsd,
      requestedUsd,
      event: 'deposit_completed_partial',
    },
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
    title: 'Withdrawal request submitted successfully',
    message: `Your withdrawal request for $${amountUsd.toFixed(2)} has been received and is pending review.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_submitted' },
  })
}

export async function notifyWithdrawalHoldThreeDaysRemaining(
  userId: string,
  amountUsd: number,
  referenceId: string
) {
  const id = await createUserNotificationOnce({
    userId,
    title: '3 days remaining on withdrawal hold',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} has 3 days remaining in the security hold before it becomes ready for payout.`,
    type: 'wallet',
    dedupeKey: `withdrawal_hold_3d:${referenceId}`,
    metadata: { referenceId, amountUsd, event: 'withdrawal_hold_3d' },
  })
  return Boolean(id)
}

export async function notifyWithdrawalHoldOneDayRemaining(
  userId: string,
  amountUsd: number,
  referenceId: string
) {
  const id = await createUserNotificationOnce({
    userId,
    title: '1 day remaining on withdrawal hold',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} has 1 day remaining in the security hold before it becomes ready for payout.`,
    type: 'wallet',
    dedupeKey: `withdrawal_hold_1d:${referenceId}`,
    metadata: { referenceId, amountUsd, event: 'withdrawal_hold_1d' },
  })
  return Boolean(id)
}

export async function notifyWithdrawalReadyForPayout(
  userId: string,
  amountUsd: number,
  referenceId?: string
) {
  return createUserNotification({
    userId,
    title: 'Ready for payout',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} has completed the security hold and is ready for payout.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_ready_for_payout' },
  })
}

export async function notifyWithdrawalApproved(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Your withdrawal has been approved',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} has been approved and will be paid out shortly.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_approved' },
  })
}

export async function notifyWithdrawalRejected(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Withdrawal rejected',
    message: `Your withdrawal of $${amountUsd.toFixed(2)} was rejected. Reserved funds have been returned to your available balance.`,
    type: 'wallet',
    metadata: { referenceId, amountUsd, event: 'withdrawal_rejected' },
  })
}

export async function notifyWithdrawalCompleted(userId: string, amountUsd: number, referenceId?: string) {
  return createUserNotification({
    userId,
    title: 'Your withdrawal has been sent successfully',
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

export async function notifyAssistanceAgentReply(
  userId: string,
  sessionId: string,
  subject: string
) {
  return createUserNotification({
    userId,
    title: 'Support specialist replied',
    message: `A PrimeFx specialist responded to "${subject}". Open Live Chat to continue.`,
    type: 'general',
    metadata: { sessionId, event: 'assistance_agent_reply' },
  })
}

export async function notifySupportEscalation(input: {
  userId: string
  ticketId: string
  ticketNumber: string
  issue: string
}) {
  await createUserNotification({
    userId: input.userId,
    title: 'Connected to PrimeFx Support',
    message: `You are now connected to a specialist. Ticket ${input.ticketNumber} has been created.`,
    type: 'general',
    metadata: {
      ticketId: input.ticketId,
      ticketNumber: input.ticketNumber,
      event: 'support_escalation',
    },
  })

  const db = getDb()
  if (!db) return

  const { data: admins } = await db
    .from('admin_profiles')
    .select('user_id, tier')
    .eq('is_active', true)
    .in('tier', [1, 3])

  for (const admin of admins ?? []) {
    await createUserNotification({
      userId: String(admin.user_id),
      title: 'New support escalation',
      message: `${input.ticketNumber}: ${input.issue.slice(0, 120)}`,
      type: 'general',
      metadata: {
        ticketId: input.ticketId,
        ticketNumber: input.ticketNumber,
        event: 'admin_support_escalation',
      },
    })
  }
}
