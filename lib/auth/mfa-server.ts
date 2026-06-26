import 'server-only'

import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface ServerMfaStatus {
  enabled: boolean
  bypassed: boolean
}

export async function getServerMfaStatus(userId: string): Promise<ServerMfaStatus> {
  const admin = createAdminSupabaseClient()

  if (admin) {
    const { data: profile } = await admin
      .from('users')
      .select('mfa_disabled_at')
      .eq('id', userId)
      .maybeSingle()

    if (profile?.mfa_disabled_at) {
      return { enabled: false, bypassed: true }
    }
  }

  const supabase = await createServerSupabaseClient()
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const verifiedFactor = factors?.totp?.find((factor) => factor.status === 'verified')

  const hasVerifiedFactor = Boolean(verifiedFactor)
  const needsChallenge =
    aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2' && hasVerifiedFactor

  return {
    enabled: hasVerifiedFactor && !needsChallenge,
    bypassed: false,
  }
}

export async function requireServerMfaEnabled(userId: string): Promise<{
  allowed: boolean
  error?: string
}> {
  const status = await getServerMfaStatus(userId)

  if (status.bypassed) {
    return { allowed: true }
  }

  if (!status.enabled) {
    const { data: factors } = await (await createServerSupabaseClient()).auth.mfa.listFactors()
    const hasFactor = Boolean(factors?.totp?.some((f) => f.status === 'verified'))

    if (!hasFactor) {
      return {
        allowed: false,
        error: 'Enable two-factor authentication in Settings before withdrawing funds.',
      }
    }

    return {
      allowed: false,
      error: 'Complete two-factor authentication verification before withdrawing funds.',
    }
  }

  return { allowed: true }
}
