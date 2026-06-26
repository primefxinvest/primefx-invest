import 'server-only'

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { ADMIN_TIER_LABELS } from './permissions'
import type { AdminContext, AdminModule, AdminProfile, AdminTier } from './types'
import { canAccessModule } from './permissions'

function getBootstrapSuperEmails(): string[] {
  const raw = process.env.ADMIN_SUPER_EMAILS ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
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
      tier: profile.tier as AdminTier,
      roleLabel: profile.role_label || ADMIN_TIER_LABELS[profile.tier as AdminTier],
      isBootstrap: false,
    }
  }

  const bootstrapEmails = getBootstrapSuperEmails()
  if (bootstrapEmails.includes(user.email.toLowerCase())) {
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

export function assertNotSelfTarget(context: AdminContext, targetUserId: string) {
  if (context.userId === targetUserId) {
    throw new Error('Admin actions on your own account are prohibited.')
  }
}
