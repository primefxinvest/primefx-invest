import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export const REFERRAL_PROGRAM_FEATURE_KEY = 'referral_program'

export type ReferralAccessState = {
  globalEnabled: boolean
  userEnabled: boolean
  canAccess: boolean
}

/** Referral program is available to every authenticated investor. */
const UNIVERSAL_REFERRAL_ACCESS: ReferralAccessState = {
  globalEnabled: true,
  userEnabled: true,
  canAccess: true,
}

export async function getReferralProgramEnabled(): Promise<boolean> {
  return true
}

export async function getReferralAccessForUser(_userId: string): Promise<ReferralAccessState> {
  return UNIVERSAL_REFERRAL_ACCESS
}

export async function getReferralAccessEnabledAdmin(userId: string): Promise<boolean | null> {
  const db = createAdminSupabaseClient()
  if (!db) return true

  const { data, error } = await db
    .from('users')
    .select('referral_access_enabled')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return true
  return Boolean(data.referral_access_enabled)
}

/** @deprecated Per-user referral locks are disabled; kept for admin audit compatibility. */
export async function setUserReferralAccess(userId: string, enabled: boolean): Promise<void> {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.')
  }

  const { error } = await db
    .from('users')
    .update({
      referral_access_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) throw error
}

export async function getReferralProgramEnabledAdmin(): Promise<{
  enabled: boolean
  configured: boolean
}> {
  const db = createAdminSupabaseClient()
  if (!db) {
    return { enabled: true, configured: false }
  }

  const { data, error } = await db
    .from('platform_features')
    .select('enabled')
    .eq('key', REFERRAL_PROGRAM_FEATURE_KEY)
    .maybeSingle()

  if (error) {
    return { enabled: true, configured: false }
  }

  return {
    enabled: true,
    configured: Boolean(data),
  }
}

/** @deprecated Global referral lock is disabled; kept for admin audit compatibility. */
export async function setReferralProgramEnabled(
  enabled: boolean,
  adminUserId: string
): Promise<void> {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin actions.')
  }

  const { error } = await db.from('platform_features').upsert(
    {
      key: REFERRAL_PROGRAM_FEATURE_KEY,
      enabled: true,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    },
    { onConflict: 'key' }
  )

  if (error) throw error

  if (!enabled) {
    // No-op: referral access cannot be disabled platform-wide.
    return
  }
}
