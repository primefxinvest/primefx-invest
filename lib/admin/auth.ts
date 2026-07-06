import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { ADMIN_TIER_LABELS } from './permissions'
import type { AdminContext, AdminModule, AdminProfile } from './types'
import { canAccessModule } from './permissions'
import {
  getAuthorizedBootstrapEmails,
  isSuperAdminEmail,
} from './super-admin'

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email || !isSuperAdminEmail(user.email)) {
    return null
  }

  const adminDb = createAdminSupabaseClient()
  let profile: AdminProfile | null = null

  if (adminDb) {
    const { data } = await adminDb
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    profile = data as AdminProfile | null
  } else {
    const { data } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    profile = data as AdminProfile | null
  }

  if (profile) {
    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: profile.role_label || ADMIN_TIER_LABELS[1],
      isBootstrap: false,
    }
  }

  const bootstrapEmails = getAuthorizedBootstrapEmails()
  if (bootstrapEmails.length > 0) {
    return {
      userId: user.id,
      email: user.email,
      tier: 1,
      roleLabel: ADMIN_TIER_LABELS[1],
      isBootstrap: true,
    }
  }

  return null
}

export { SUPER_ADMIN_EMAIL, isSuperAdminEmail } from './super-admin'

export async function requireAdmin(): Promise<AdminContext> {
  const context = await getAdminContext()
  if (!context) {
    redirect('/admin/unauthorized')
  }
  return context
}

export async function requireAdminModule(module: AdminModule): Promise<AdminContext> {
  const context = await requireAdmin()
  if (!canAccessModule(context.tier, module)) {
    redirect('/admin/unauthorized')
  }
  return context
}

export function assertModuleAccess(context: AdminContext, module: AdminModule) {
  if (!canAccessModule(context.tier, module)) {
    throw new Error('You do not have permission to perform this action.')
  }
}

export type AdminMutationResult =
  | { success: true }
  | { success: false; error: string }

export function getSelfTargetError(
  context: AdminContext,
  targetUserId: string
): string | undefined {
  if (context.userId === targetUserId) {
    return 'Admin actions on your own account are prohibited.'
  }
}

export function rejectSelfTarget(
  context: AdminContext,
  targetUserId: string
): AdminMutationResult | null {
  const error = getSelfTargetError(context, targetUserId)
  return error ? { success: false, error } : null
}

/** @deprecated Prefer rejectSelfTarget for server actions that return AdminMutationResult */
export function assertNotSelfTarget(context: AdminContext, targetUserId: string) {
  const error = getSelfTargetError(context, targetUserId)
  if (error) {
    throw new Error(error)
  }
}
