'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { fetchReferralProgramOverviewServer } from '@/lib/referral/overview-server'
import { ensureUserReferralCode } from '@/lib/referral/server'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { requireActiveAccountForFinancialAction } from '@/lib/security/require-active-account'
import { requireVerifiedEmail, EMAIL_NOT_VERIFIED_CODE } from '@/lib/auth/require-verified-email'

export async function ensureMyReferralCode(): Promise<string | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const emailVerification = requireVerifiedEmail(user)
  if (!emailVerification.allowed) {
    return null
  }

  try {
    await enforceUserRateLimit('referral:claim', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return null
    }
    throw err
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'referral')
  if (!account.allowed) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, referral_code')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.referral_code) {
    return profile.referral_code as string
  }

  return ensureUserReferralCode(user.id, profile?.full_name as string | undefined)
}

export async function fetchReferralProgramOverviewAction() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const emailVerification = requireVerifiedEmail(user)
  if (!emailVerification.allowed) {
    const error = new Error(emailVerification.error)
    ;(error as Error & { code?: string }).code = EMAIL_NOT_VERIFIED_CODE
    throw error
  }

  const account = await requireActiveAccountForFinancialAction(user.id, 'referral')
  if (!account.allowed) {
    throw new Error(account.error)
  }

  return fetchReferralProgramOverviewServer(user.id)
}
