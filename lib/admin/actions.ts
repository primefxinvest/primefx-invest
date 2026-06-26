'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { assertModuleAccess, assertNotSelfTarget, getAdminContext } from './auth'
import { logAdminAction } from './audit'
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

export async function updateUserKycStatus(
  userId: string,
  status: 'Verified' | 'Rejected' | 'Pending',
  reasonCode?: string
) {
  const context = await getContext()
  assertModuleAccess(context, 'kyc_aml_compliance')
  assertNotSelfTarget(context, userId)

  if (status === 'Rejected' && !reasonCode?.trim()) {
    throw new Error('KYC rejections must include a documented reason code.')
  }

  const db = getDb()
  const { data: before } = await db.from('users').select('*').eq('id', userId).single()

  const { error } = await db
    .from('users')
    .update({
      kyc_status: status,
      kyc_rejection_reason: status === 'Rejected' ? reasonCode : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'kyc_aml_compliance',
    action: `kyc_${status.toLowerCase()}`,
    targetUserId: userId,
    beforeState: before as Record<string, unknown>,
    afterState: { kyc_status: status, kyc_rejection_reason: reasonCode ?? null },
    reasonCode: reasonCode ?? undefined,
  })

  revalidatePath('/admin/kyc')
  revalidatePath('/admin/users')
  return { success: true }
}

export async function updateUserAccountStatus(
  userId: string,
  status: AccountStatus,
  reason?: string
) {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  assertNotSelfTarget(context, userId)

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

export async function updateUserInvestorTier(userId: string, tier: string) {
  const context = await getContext()
  assertModuleAccess(context, 'user_management')
  assertNotSelfTarget(context, userId)

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
