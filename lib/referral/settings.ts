import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const REFERRAL_PROGRAM_FEATURE_KEY = 'referral_program'

export type ReferralAccessState = {
  globalEnabled: boolean
  userEnabled: boolean
  canAccess: boolean
}

const REFERRAL_QUERY_TIMEOUT_MS = 15_000

async function withReferralQueryTimeout<T>(run: () => PromiseLike<T>, fallback: T): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      Promise.resolve(run()),
      new Promise<T>((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), REFERRAL_QUERY_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}

export async function getReferralProgramEnabled(): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const result = await withReferralQueryTimeout(
      () =>
        supabase
          .from('platform_features')
          .select('enabled')
          .eq('key', REFERRAL_PROGRAM_FEATURE_KEY)
          .maybeSingle(),
      null
    )

    if (!result || result.error || !result.data) return false
    return Boolean(result.data.enabled)
  } catch {
    return false
  }
}

export async function getReferralAccessForUser(userId: string): Promise<ReferralAccessState> {
  const fallback: ReferralAccessState = {
    globalEnabled: false,
    userEnabled: false,
    canAccess: false,
  }

  try {
    const supabase = await createServerSupabaseClient()
    const queryResults = await withReferralQueryTimeout(
      () =>
        Promise.all([
          supabase
            .from('platform_features')
            .select('enabled')
            .eq('key', REFERRAL_PROGRAM_FEATURE_KEY)
            .maybeSingle(),
          supabase
            .from('users')
            .select('referral_access_enabled')
            .eq('id', userId)
            .maybeSingle(),
        ]),
      null
    )

    if (!queryResults) {
      return fallback
    }

    const [featureResult, userResult] = queryResults

    const globalEnabled = !featureResult.error && Boolean(featureResult.data?.enabled)
    if (!globalEnabled) {
      return fallback
    }

    const userEnabled =
      !userResult.error && Boolean(userResult.data?.referral_access_enabled)

    return {
      globalEnabled: true,
      userEnabled,
      canAccess: userEnabled,
    }
  } catch {
    return fallback
  }
}

export async function getReferralAccessEnabledAdmin(userId: string): Promise<boolean | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  const { data, error } = await db
    .from('users')
    .select('referral_access_enabled')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return null
  return Boolean(data.referral_access_enabled)
}

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
