import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const REFERRAL_PROGRAM_FEATURE_KEY = 'referral_program'

export async function getReferralProgramEnabled(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('platform_features')
      .select('enabled')
      .eq('key', REFERRAL_PROGRAM_FEATURE_KEY)
      .maybeSingle()

    if (error || !data) return false
    return Boolean(data.enabled)
  } catch {
    return false
  }
}

export async function getReferralProgramEnabledAdmin(): Promise<{
  enabled: boolean
  configured: boolean
}> {
  const db = createAdminSupabaseClient()
  if (!db) {
    return { enabled: false, configured: false }
  }

  const { data, error } = await db
    .from('platform_features')
    .select('enabled')
    .eq('key', REFERRAL_PROGRAM_FEATURE_KEY)
    .maybeSingle()

  if (error) {
    return { enabled: false, configured: false }
  }

  return {
    enabled: Boolean(data?.enabled),
    configured: true,
  }
}

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
      enabled,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId,
    },
    { onConflict: 'key' }
  )

  if (error) throw error
}
