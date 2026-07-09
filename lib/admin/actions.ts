'use server'

import { notifyKycStatusChange } from '@/lib/notifications/service'

import { revalidatePath } from 'next/cache'
import { adminReenableUserMfa, adminResetUserMfa } from '@/lib/auth/mfa-admin'
import {
  settleApprovedTransaction,
  settleRejectedTransaction,
} from '@/lib/payments/wallet-ledger'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  assertModuleAccess,
  getAdminContext,
  rejectSelfTarget,
  type AdminMutationResult,
} from './auth'
import { logAdminAction } from './audit'
import { logSecurityAudit } from '@/lib/security/security-audit'
import { DUAL_APPROVAL_THRESHOLD } from './permissions'
import type { AccountStatus, AdminPlanRow } from './types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.')
  }
  return db
}

async function getContext() {
  const context = await getAdminContext()
  if (!context) {
    throw new Error('Unauthorized')
  }
  return context
}

export async function adminDisableUserMfa(
  userId: string,
  reason: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  const selfReject = rejectSelfTarget(context, userId)
  if (selfReject) return selfReject

  await adminResetUserMfa(userId, reason)

  await logAdminAction({
    context,
    module: 'security_risk',
    action: 'mfa_reset',
    targetUserId: userId,
    afterState: { mfa_disabled: true },
    reasonCode: reason,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function adminEnableUserMfaRequirement(
  userId: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  const selfReject = rejectSelfTarget(context, userId)
  if (selfReject) return selfReject

  await adminReenableUserMfa(userId)

  await logAdminAction({
    context,
    module: 'security_risk',
    action: 'mfa_requirement_restored',
    targetUserId: userId,
    afterState: { mfa_disabled: false },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function createInvestmentPlan(input: {
  name: string
  weekly_roi: number
  risk_level: string
  minimum_investment: number
  max_investment?: number | null
  duration?: string
  payout_frequency?: string
  description?: string
  visibility?: string
  max_investors?: number | null
}) {
  const context = await getContext()
  assertModuleAccess(context, 'investment_plan_management')

  const db = getDb()
  const { data, error } = await db
    .from('investment_plans')
    .insert({
      name: input.name.trim(),
      weekly_roi: input.weekly_roi,
      risk_level: input.risk_level,
      minimum_investment: input.minimum_investment,
      max_investment: input.max_investment ?? null,
      duration: input.duration ?? 'Flexible',
      payout_frequency: input.payout_frequency ?? 'Daily',
      description: input.description ?? null,
      visibility: input.visibility ?? 'public',
      max_investors: input.max_investors ?? null,
      is_active: true,
      investor_count: 0,
    })
    .select('id')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create plan.')

  await logAdminAction({
    context,
    module: 'investment_plan_management',
    action: 'plan_created',
    targetResource: String(data.id),
    afterState: input as Record<string, unknown>,
  })

  revalidatePath('/admin/plans')
  revalidatePath('/invest')
  return { success: true, planId: String(data.id) }
}

export async function deleteInvestmentPlan(planId: string) {
  const context = await getContext()
  assertModuleAccess(context, 'investment_plan_management')

  const db = getDb()
  const { data: before } = await db.from('investment_plans').select('*').eq('id', planId).single()
  if (!before) throw new Error('Plan not found.')

  if (Number(before.investor_count ?? 0) > 0) {
    const { error } = await db.from('investment_plans').update({ is_active: false }).eq('id', planId)
    if (error) throw new Error(error.message)
    await logAdminAction({
      context,
      module: 'investment_plan_management',
      action: 'plan_deactivated',
      targetResource: planId,
      beforeState: before as Record<string, unknown>,
      afterState: { is_active: false },
    })
  } else {
    const { error } = await db.from('investment_plans').delete().eq('id', planId)
    if (error) throw new Error(error.message)
    await logAdminAction({
      context,
      module: 'investment_plan_management',
      action: 'plan_deleted',
      targetResource: planId,
      beforeState: before as Record<string, unknown>,
    })
  }

  revalidatePath('/admin/plans')
  revalidatePath('/invest')
  return { success: true }
}

async function appendUserAdminNote(
  db: ReturnType<typeof getDb>,
  userId: string,
  entry: string
) {
  const { data: before } = await db.from('users').select('admin_notes').eq('id', userId).single()
  const merged = [before?.admin_notes, entry].filter(Boolean).join('\n')

  const { error } = await db
    .from('users')
    .update({ admin_notes: merged, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)
  return merged
}

export async function updateUserKycStatus(
  userId: string,
  status: 'Verified' | 'Rejected' | 'Pending',
  reasonCode?: string,
  comment?: string
) {
  const context = await getContext()
  assertModuleAccess(context, 'kyc_aml_compliance')

  if (status === 'Rejected' && !reasonCode?.trim()) {
    throw new Error('KYC rejections must include a documented reason code.')
  }

  const db = getDb()
  const { data: before } = await db.from('users').select('*').eq('id', userId).single()

  const { error } = await db
    .from('users')
    .update({
      kyc_status: status,
      kyc_rejection_reason: status === 'Rejected' ? reasonCode?.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await db
    .from('kyc_submissions')
    .update({
      review_status: status === 'Verified' ? 'verified' : status === 'Rejected' ? 'rejected' : 'submitted',
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  const trimmedComment = comment?.trim()
  if (trimmedComment) {
    const noteParts = [`[${new Date().toISOString()}] [KYC] Status set to ${status}`]
    if (reasonCode?.trim()) noteParts.push(`Reason: ${reasonCode.trim()}`)
    noteParts.push(trimmedComment)
    await appendUserAdminNote(db, userId, noteParts.join(' — '))
  }

  await logAdminAction({
    context,
    module: 'kyc_aml_compliance',
    action: `kyc_${status.toLowerCase()}`,
    targetUserId: userId,
    beforeState: before as Record<string, unknown>,
    afterState: {
      kyc_status: status,
      kyc_rejection_reason: reasonCode ?? null,
      kyc_comment: trimmedComment ?? null,
    },
    reasonCode: reasonCode ?? undefined,
  })

  if (before?.kyc_status !== status) {
    await logSecurityAudit({
      eventType: 'kyc.admin_override',
      userId,
      actorId: context.userId,
      metadata: {
        previousStatus: before?.kyc_status ?? null,
        newStatus: status,
        reasonCode: reasonCode ?? null,
      },
    })
  }

  if ((status === 'Verified' || status === 'Rejected') && before?.kyc_status !== status) {
    await notifyKycStatusChange(userId, status)
  }

  revalidatePath('/admin/kyc')
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function addKycReviewNote(userId: string, note: string) {
  const context = await getContext()
  assertModuleAccess(context, 'kyc_aml_compliance')

  const trimmed = note.trim()
  if (!trimmed) throw new Error('KYC review notes cannot be empty.')

  const db = getDb()
  const merged = await appendUserAdminNote(
    db,
    userId,
    `[${new Date().toISOString()}] [KYC] ${trimmed}`
  )

  await logAdminAction({
    context,
    module: 'kyc_aml_compliance',
    action: 'kyc_note_added',
    targetUserId: userId,
    afterState: { admin_notes: merged },
  })

  revalidatePath('/admin/kyc')
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function updateUserAccountStatus(
  userId: string,
  status: AccountStatus,
  reason?: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  const selfReject = rejectSelfTarget(context, userId)
  if (selfReject) return selfReject

  if ((status === 'suspended' || status === 'banned') && !reason?.trim()) {
    throw new Error('User bans and suspensions must be logged with justification.')
  }

  const db = getDb()
  const { data: before } = await db.from('users').select('*').eq('id', userId).single()

  const { error } = await db
    .from('users')
    .update({
      account_status: status,
      suspended_at: status !== 'active' ? new Date().toISOString() : null,
      suspended_reason: status !== 'active' ? reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'user_management',
    action: `account_${status}`,
    targetUserId: userId,
    beforeState: before as Record<string, unknown>,
    afterState: { account_status: status, suspended_reason: reason ?? null },
    reasonCode: reason ?? undefined,
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserInvestorTier(
  userId: string,
  tier: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  const selfReject = rejectSelfTarget(context, userId)
  if (selfReject) return selfReject

  const db = getDb()
  const { data: before } = await db.from('users').select('*').eq('id', userId).single()

  const { error } = await db
    .from('users')
    .update({ investor_tier: tier, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'user_management',
    action: 'investor_tier_updated',
    targetUserId: userId,
    beforeState: before as Record<string, unknown>,
    afterState: { investor_tier: tier },
  })

  await logSecurityAudit({
    eventType: 'admin.permission_changed',
    userId,
    actorId: context.userId,
    metadata: {
      field: 'investor_tier',
      previousValue: before?.investor_tier ?? null,
      newValue: tier,
    },
  })

  revalidatePath('/admin/users')
  return { success: true }
}

export async function addAdminNote(userId: string, note: string) {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')

  const db = getDb()
  const { data: before } = await db.from('users').select('admin_notes').eq('id', userId).single()
  const merged = [before?.admin_notes, `[${new Date().toISOString()}] ${note}`]
    .filter(Boolean)
    .join('\n')

  const { error } = await db
    .from('users')
    .update({ admin_notes: merged, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'user_management',
    action: 'admin_note_added',
    targetUserId: userId,
    afterState: { admin_notes: merged },
  })

  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: 'Completed' | 'Rejected' | 'Pending',
  reasonCode?: string
) {
  const context = await getContext()
  assertModuleAccess(context, 'financial_management')

  const db = getDb()
  const { data: before } = await db.from('transactions').select('*').eq('id', transactionId).single()
  if (!before) throw new Error('Transaction not found')

  const amount = Number(before.amount ?? 0)
  if (amount >= DUAL_APPROVAL_THRESHOLD && context.tier !== 1) {
    throw new Error(
      `Financial adjustments above $${DUAL_APPROVAL_THRESHOLD.toLocaleString()} require Super Admin approval.`
    )
  }

  const previousStatus = String(before.status ?? '').toLowerCase()
  const nextStatus = status.toLowerCase()

  if (previousStatus !== 'pending') {
    throw new Error('Only pending transactions can be approved or rejected.')
  }

  if (nextStatus === 'completed') {
    await settleApprovedTransaction({
      user_id: String(before.user_id),
      type: String(before.type ?? ''),
      amount: before.amount,
      reference_id: (before.reference_id as string | null) ?? null,
    })
  } else if (nextStatus === 'rejected') {
    await settleRejectedTransaction({
      user_id: String(before.user_id),
      type: String(before.type ?? ''),
      amount: before.amount,
      reference_id: (before.reference_id as string | null) ?? null,
    })
  }

  const { error } = await db.from('transactions').update({ status }).eq('id', transactionId)
  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'financial_management',
    action: `transaction_${status.toLowerCase()}`,
    targetUserId: String(before.user_id),
    targetResource: transactionId,
    beforeState: before as Record<string, unknown>,
    afterState: { status },
    reasonCode,
  })

  revalidatePath('/admin/transactions')
  revalidatePath('/admin/wallets')
  revalidatePath('/wallet')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}

export async function togglePlanActive(planId: string, isActive: boolean) {
  const context = await getContext()
  assertModuleAccess(context, 'investment_plan_management')

  const db = getDb()
  const { data: before } = await db.from('investment_plans').select('*').eq('id', planId).single()

  const { error } = await db.from('investment_plans').update({ is_active: isActive }).eq('id', planId)
  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_plan_management',
    action: isActive ? 'plan_activated' : 'plan_deactivated',
    targetResource: planId,
    beforeState: before as Record<string, unknown>,
    afterState: { is_active: isActive },
  })

  revalidatePath('/admin/plans')
  return { success: true }
}

export async function updateInvestmentPlan(
  planId: string,
  updates: Partial<
    Pick<
      AdminPlanRow,
      | 'name'
      | 'weekly_roi'
      | 'risk_level'
      | 'minimum_investment'
      | 'max_investment'
      | 'description'
      | 'visibility'
      | 'max_investors'
    >
  >
) {
  const context = await getContext()
  assertModuleAccess(context, 'investment_plan_management')

  const db = getDb()
  const { data: before } = await db.from('investment_plans').select('*').eq('id', planId).single()

  const { error } = await db.from('investment_plans').update(updates).eq('id', planId)
  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_plan_management',
    action: 'plan_updated',
    targetResource: planId,
    beforeState: before as Record<string, unknown>,
    afterState: updates as Record<string, unknown>,
  })

  revalidatePath('/admin/plans')
  return { success: true }
}

export async function adminFulfillRankReward(
  rewardId: string,
  note?: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'rewards_referral')

  const db = getDb()
  const { data: before } = await db.from('referral_rank_rewards').select('*').eq('id', rewardId).single()
  if (!before) return { success: false, error: 'Reward not found.' }

  await db
    .from('referral_rank_rewards')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      admin_notes: note?.trim() || before.admin_notes,
    })
    .eq('id', rewardId)

  await logAdminAction({
    context,
    module: 'rewards_referral',
    action: 'rank_reward_fulfilled',
    targetResource: rewardId,
    targetUserId: String(before.user_id),
    beforeState: before as Record<string, unknown>,
    afterState: { status: 'fulfilled' },
  })

  revalidatePath('/admin/rewards')
  return { success: true }
}

export async function adminPublishTermsUpdate(message: string): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'platform_configuration')

  const { notifyAllUsersOfTermsUpdate, ensurePlatformTermsPublished } = await import(
    '@/lib/terms/service'
  )
  await ensurePlatformTermsPublished()
  const result = await notifyAllUsersOfTermsUpdate(message)

  await logAdminAction({
    context,
    module: 'platform_configuration',
    action: 'terms_published',
    afterState: { notified: result.notified },
  })

  return { success: true }
}

const SUPPORT_STATUSES = new Set(['open', 'in_progress', 'in-progress', 'resolved', 'closed'])

function normalizeSupportStatus(status: string) {
  const value = status.trim().toLowerCase().replace(/-/g, '_')
  if (value === 'inprogress') return 'in_progress'
  return value
}

export async function adminReplySupportTicket(
  ticketId: string,
  message: string,
  status?: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'support_tickets')

  const body = message.trim()
  if (!body) {
    return { success: false, error: 'Reply message is required.' }
  }

  const db = getDb()
  const { data: ticket, error: ticketError } = await db
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle()

  if (ticketError) return { success: false, error: ticketError.message }
  if (!ticket) return { success: false, error: 'Ticket not found.' }

  const nextStatus = status ? normalizeSupportStatus(status) : undefined
  if (nextStatus && !SUPPORT_STATUSES.has(nextStatus)) {
    return { success: false, error: 'Invalid ticket status.' }
  }

  const { error: messageError } = await db.from('support_ticket_messages').insert({
    ticket_id: ticketId,
    sender_type: 'admin',
    sender_id: context.userId,
    message: body,
  })

  if (messageError) return { success: false, error: messageError.message }

  const { insertAgentAssistanceMessage, resolveAssistanceSessionIdForTicket } = await import(
    '@/lib/assistance/mirror-agent-reply'
  )
  const sessionId = await resolveAssistanceSessionIdForTicket(db, {
    id: ticketId,
    assistance_session_id: (ticket.assistance_session_id as string) ?? null,
  })

  if (sessionId) {
    const mirrored = await insertAgentAssistanceMessage(db, {
      sessionId,
      content: body,
      agentId: context.userId,
      agentEmail: context.email,
      ticketId,
    })
    if (!mirrored.ok) {
      return {
        success: false,
        error: mirrored.error ?? 'Reply saved to ticket but failed to deliver to live chat.',
      }
    }
  }

  const currentStatus = String(ticket.status ?? 'open').toLowerCase().replace(/-/g, '_')
  const resolvedStatus =
    nextStatus ?? (currentStatus === 'open' ? 'in_progress' : String(ticket.status))

  await db
    .from('support_tickets')
    .update({
      status: resolvedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ticketId)

  const { notifySupportTicketReply } = await import('@/lib/notifications/service')
  await notifySupportTicketReply(
    String(ticket.user_id),
    ticketId,
    String(ticket.subject)
  )

  await logAdminAction({
    context,
    module: 'support_tickets',
    action: 'support_ticket_reply',
    targetResource: ticketId,
    targetUserId: String(ticket.user_id),
    afterState: { status: resolvedStatus },
  })

  revalidatePath('/admin/support')
  revalidatePath(`/admin/support/${ticketId}`)
  return { success: true }
}

export async function adminUpdateSupportTicketStatus(
  ticketId: string,
  status: string,
  priority?: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'support_tickets')

  const nextStatus = normalizeSupportStatus(status)
  if (!SUPPORT_STATUSES.has(nextStatus)) {
    return { success: false, error: 'Invalid ticket status.' }
  }

  const db = getDb()
  const { data: before } = await db.from('support_tickets').select('*').eq('id', ticketId).maybeSingle()
  if (!before) return { success: false, error: 'Ticket not found.' }

  const update: Record<string, string> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }
  if (priority?.trim()) {
    update.priority = priority.trim().toLowerCase()
  }

  const { error } = await db.from('support_tickets').update(update).eq('id', ticketId)
  if (error) return { success: false, error: error.message }

  await logAdminAction({
    context,
    module: 'support_tickets',
    action: 'support_ticket_status_updated',
    targetResource: ticketId,
    targetUserId: String(before.user_id),
    beforeState: before as Record<string, unknown>,
    afterState: update,
  })

  revalidatePath('/admin/support')
  revalidatePath(`/admin/support/${ticketId}`)
  return { success: true }
}

export async function processDueFinancialJobsAction() {
  const context = await getContext()
  assertModuleAccess(context, 'financial_management')

  const { processDueFinancialJobs } = await import('@/lib/cron/daily-jobs')
  const result = await processDueFinancialJobs()

  await logAdminAction({
    context,
    module: 'financial_management',
    action: 'process_due_financial_jobs',
    afterState: result as unknown as Record<string, unknown>,
  })

  revalidatePath('/admin/transactions')
  revalidatePath('/admin/wallets')
  revalidatePath('/admin/rewards')
  revalidatePath('/wallet')
  revalidatePath('/transactions')
  revalidatePath('/portfolio')

  return { success: true as const, ...result }
}

export async function approveWithdrawalQueueItem(requestId: string) {
  const context = await getContext()
  assertModuleAccess(context, 'financial_management')

  const { executeWithdrawalPayoutAfterApproval } = await import('@/lib/payments/withdrawal-payout')
  const result = await executeWithdrawalPayoutAfterApproval(requestId)

  await logAdminAction({
    context,
    module: 'financial_management',
    action: 'withdrawal_approved',
    targetResource: requestId,
    afterState: result as unknown as Record<string, unknown>,
  })

  revalidatePath('/admin/rewards')
  revalidatePath('/admin/transactions')
  revalidatePath('/wallet')
  revalidatePath('/wallet/withdraw')
  revalidatePath('/transactions')

  return result
}

export async function rejectWithdrawalQueueItem(requestId: string, reason?: string) {
  const context = await getContext()
  assertModuleAccess(context, 'financial_management')

  const { rejectWithdrawalRequest } = await import('@/lib/payments/withdrawal-payout')
  const result = await rejectWithdrawalRequest(requestId, reason)

  await logAdminAction({
    context,
    module: 'financial_management',
    action: 'withdrawal_rejected',
    targetResource: requestId,
    afterState: result as unknown as Record<string, unknown>,
    reasonCode: reason,
  })

  revalidatePath('/admin/rewards')
  revalidatePath('/admin/transactions')
  revalidatePath('/wallet')
  revalidatePath('/wallet/withdraw')
  revalidatePath('/transactions')

  return result
}
