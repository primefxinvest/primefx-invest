import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export async function isUserMfaBypassed(userId: string): Promise<boolean> {
  const db = createAdminSupabaseClient()
  if (!db) return false

  const { data } = await db
    .from('users')
    .select('mfa_disabled_at')
    .eq('id', userId)
    .maybeSingle()

  return Boolean(data?.mfa_disabled_at)
}

export async function adminResetUserMfa(userId: string, reason: string) {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to reset user 2FA.')
  }

  const trimmedReason = reason.trim()
  if (!trimmedReason) {
    throw new Error('A reason is required to reset user 2FA.')
  }

  const { data: authUser, error: getUserError } = await db.auth.admin.getUserById(userId)
  if (getUserError || !authUser.user) {
    throw new Error(getUserError?.message ?? 'User not found in authentication.')
  }

  try {
    const { data: factors } = await db.auth.admin.mfa.listFactors({ userId })
    for (const factor of factors?.factors ?? []) {
      await db.auth.admin.mfa.deleteFactor({ id: factor.id, userId })
    }
  } catch {
    // MFA admin API may be unavailable on older projects — continue with metadata bypass
  }

  const { error: updateAuthError } = await db.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...(authUser.user.user_metadata ?? {}),
      two_factor_enabled: false,
      mfa_admin_reset_at: new Date().toISOString(),
    },
  })

  if (updateAuthError) {
    throw new Error(updateAuthError.message)
  }

  const { error: profileError } = await db
    .from('users')
    .update({
      mfa_disabled_at: new Date().toISOString(),
      mfa_disabled_reason: trimmedReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) {
    throw new Error(profileError.message)
  }
}

export async function adminReenableUserMfa(userId: string) {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required.')
  }

  const { error } = await db
    .from('users')
    .update({
      mfa_disabled_at: null,
      mfa_disabled_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

export async function getAdminUserMfaSummary(userIds: string[]) {
  const db = createAdminSupabaseClient()
  if (!db || userIds.length === 0) {
    return {} as Record<string, { bypassed: boolean; factorCount: number }>
  }

  const { data: profiles } = await db
    .from('users')
    .select('id, mfa_disabled_at')
    .in('id', userIds)

  const summary: Record<string, { bypassed: boolean; factorCount: number }> = {}

  for (const id of userIds) {
    summary[id] = { bypassed: false, factorCount: 0 }
  }

  for (const profile of profiles ?? []) {
    summary[String(profile.id)] = {
      bypassed: Boolean(profile.mfa_disabled_at),
      factorCount: 0,
    }
  }

  for (const id of userIds) {
    if (summary[id]?.bypassed) continue
    try {
      const { data: factors } = await db.auth.admin.mfa.listFactors({ userId: id })
      summary[id].factorCount = factors?.factors?.length ?? 0
    } catch {
      summary[id].factorCount = 0
    }
  }

  return summary
}
