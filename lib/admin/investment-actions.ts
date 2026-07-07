'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import {
  assertModuleAccess,
  getAdminContext,
  rejectSelfTarget,
  type AdminMutationResult,
} from './auth'
import { canAccessModule } from './permissions'
import { logAdminAction } from './audit'
import type { AdminDisplayRank } from './investment-types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin investment actions.')
  }
  return db
}

async function getContext() {
  const context = await getAdminContext()
  if (!context) throw new Error('Unauthorized')
  return context
}

export async function adminAssignDisplayRank(
  userId: string,
  rankId: string | null
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')
  const selfReject = rejectSelfTarget(context, userId)
  if (selfReject) return selfReject

  const db = getDb()
  const { data: before } = await db
    .from('users')
    .select('id, email, admin_display_rank_id')
    .eq('id', userId)
    .single()

  const { error } = await db
    .from('users')
    .update({
      admin_display_rank_id: rankId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'rank_changed',
    targetUserId: userId,
    beforeState: { admin_display_rank_id: before?.admin_display_rank_id ?? null },
    afterState: { admin_display_rank_id: rankId },
  })

  revalidatePath('/admin/investments')
  revalidatePath('/admin/investments/ranks')
  revalidatePath(`/admin/users/${userId}`)
  return { success: true }
}

export async function adminBulkAssignDisplayRank(
  userIds: string[],
  rankId: string | null
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  const db = getDb()
  const filtered = userIds.filter((id) => id !== context.userId)
  if (!filtered.length) return { success: false, error: 'No eligible users selected.' }

  const { error } = await db
    .from('users')
    .update({
      admin_display_rank_id: rankId,
      updated_at: new Date().toISOString(),
    })
    .in('id', filtered)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'bulk_rank_changed',
    afterState: { rank_id: rankId, user_count: filtered.length },
    metadata: { user_ids: filtered },
  })

  revalidatePath('/admin/investments')
  return { success: true }
}

export async function adminUpdateInvestmentStatus(
  investmentId: string,
  status: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  const db = getDb()
  const { data: before } = await db
    .from('investments')
    .select('id, user_id, status')
    .eq('id', investmentId)
    .single()

  const { error } = await db
    .from('investments')
    .update({ status })
    .eq('id', investmentId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'status_updated',
    targetUserId: before?.user_id as string | undefined,
    targetResource: investmentId,
    beforeState: { status: before?.status },
    afterState: { status },
  })

  revalidatePath('/admin/investments')
  revalidatePath(`/admin/investments/${investmentId}`)
  return { success: true }
}

export async function adminBulkUpdateInvestmentStatus(
  investmentIds: string[],
  status: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  const db = getDb()
  const { error } = await db.from('investments').update({ status }).in('id', investmentIds)
  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'bulk_status_updated',
    afterState: { status, count: investmentIds.length },
    metadata: { investment_ids: investmentIds },
  })

  revalidatePath('/admin/investments')
  return { success: true }
}

export async function adminLogInvestmentViewed(
  investmentId: string,
  userId: string
): Promise<void> {
  const context = await getAdminContext()
  if (!context || !canAccessModule(context.tier, 'investment_management')) return

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'investment_viewed',
    targetUserId: userId,
    targetResource: investmentId,
  })
}

export async function adminLogInvestmentExported(
  format: string,
  count: number
): Promise<void> {
  const context = await getContext()
  if (!context) return

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'investment_exported',
    afterState: { format, count },
  })
}

export async function adminCreateDisplayRank(input: {
  name: string
  badge?: string
  color?: string
  icon?: string
  description?: string
  priority?: number
  benefits?: string[]
  admin_notes?: string
}): Promise<AdminMutationResult & { rank?: AdminDisplayRank }> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  const db = getDb()
  const { data, error } = await db
    .from('admin_display_ranks')
    .insert({
      name: input.name.trim(),
      badge: input.badge ?? null,
      color: input.color ?? '#0052ff',
      icon: input.icon ?? 'Sparkles',
      description: input.description ?? null,
      priority: input.priority ?? 0,
      benefits: input.benefits ?? [],
      admin_notes: input.admin_notes ?? null,
      status: 'active',
      is_custom: true,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'rank_created',
    afterState: { name: input.name },
    targetResource: String(data.id),
  })

  revalidatePath('/admin/investments/ranks')
  return { success: true }
}

export async function adminUpdateDisplayRank(
  rankId: string,
  updates: Partial<{
    name: string
    badge: string
    color: string
    icon: string
    description: string
    priority: number
    benefits: string[]
    admin_notes: string
    status: string
  }>
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  const db = getDb()
  const { data: before } = await db
    .from('admin_display_ranks')
    .select('*')
    .eq('id', rankId)
    .single()

  const { error } = await db
    .from('admin_display_ranks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', rankId)

  if (error) throw new Error(error.message)

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'rank_updated',
    targetResource: rankId,
    beforeState: before as Record<string, unknown>,
    afterState: updates as Record<string, unknown>,
  })

  revalidatePath('/admin/investments/ranks')
  return { success: true }
}

export async function adminSendInvestmentNotification(
  userIds: string[],
  message: string
): Promise<AdminMutationResult> {
  const context = await getContext()
  assertModuleAccess(context, 'investment_management')

  await logAdminAction({
    context,
    module: 'investment_management',
    action: 'notification_sent',
    afterState: { message, user_count: userIds.length },
    metadata: { user_ids: userIds },
  })

  return { success: true }
}
