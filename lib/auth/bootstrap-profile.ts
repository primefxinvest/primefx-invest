'use server'

import { createAdminSupabaseClient, getServiceRoleKeyIssue } from '@/lib/supabase/admin-server'
import {
  ensureUserReferralCode,
  normalizeReferralCode,
  recordReferralForNewUser,
} from '@/lib/referral/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'

const AUTH_USER_RETRY_ATTEMPTS = 5
const AUTH_USER_RETRY_DELAY_MS = 400

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mapBootstrapError(code: string | undefined, fallback?: string): string {
  if (code === 'AUTH_USER_NOT_FOUND') {
    return 'Account creation is still in progress. Please try again in a moment.'
  }
  if (code === 'INVALID_USER_ID') {
    return 'Invalid account identifier. Please try registering again.'
  }
  return fallback ?? 'Profile setup failed. Please try again or contact support.'
}

async function rollbackPartialProfile(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  userId: string
) {
  await admin.from('portfolios').delete().eq('user_id', userId)
  await admin.from('wallet_balances').delete().eq('user_id', userId)
  await admin.from('users').delete().eq('id', userId)
}

async function bootstrapProfileAtomic(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  input: {
    userId: string
    email: string
    fullName: string
    investorTier: string
  }
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt < AUTH_USER_RETRY_ATTEMPTS; attempt += 1) {
    const { data, error } = await admin.rpc('bootstrap_user_profile_atomic', {
      p_user_id: input.userId,
      p_email: input.email,
      p_full_name: input.fullName,
      p_investor_tier: input.investorTier,
    })

    if (error) {
      if (error.message.includes('bootstrap_user_profile_atomic') && attempt === 0) {
        return bootstrapProfileFallback(admin, input)
      }
      return { success: false, error: error.message }
    }

    const result = data as { success?: boolean; error?: string } | null
    if (result?.success) {
      return { success: true }
    }

    const code = result?.error
    if (code === 'AUTH_USER_NOT_FOUND' && attempt < AUTH_USER_RETRY_ATTEMPTS - 1) {
      await sleep(AUTH_USER_RETRY_DELAY_MS)
      continue
    }

    return { success: false, error: mapBootstrapError(code) }
  }

  return { success: false, error: mapBootstrapError('AUTH_USER_NOT_FOUND') }
}

async function bootstrapProfileFallback(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  input: {
    userId: string
    email: string
    fullName: string
    investorTier: string
  }
): Promise<{ success: boolean; error?: string }> {
  const { data: authData, error: authError } = await admin.auth.admin.getUserById(input.userId)
  if (authError || !authData?.user) {
    return { success: false, error: mapBootstrapError('AUTH_USER_NOT_FOUND') }
  }

  const { error: userError } = await admin.from('users').upsert(
    {
      id: input.userId,
      email: input.email,
      full_name: input.fullName,
      investor_tier: input.investorTier,
      referral_access_enabled: true,
    },
    { onConflict: 'id' }
  )

  if (userError) {
    return { success: false, error: mapBootstrapError(undefined, userError.message) }
  }

  const { error: walletError } = await admin.from('wallet_balances').upsert(
    {
      user_id: input.userId,
      available_balance: 0,
      pending_balance: 0,
      bonus_balance: 0,
      total_balance: 0,
    },
    { onConflict: 'user_id' }
  )

  if (walletError) {
    await rollbackPartialProfile(admin, input.userId)
    return { success: false, error: walletError.message }
  }

  const { data: existingPortfolio } = await admin
    .from('portfolios')
    .select('id')
    .eq('user_id', input.userId)
    .maybeSingle()

  if (!existingPortfolio) {
    const { error: portfolioError } = await admin.from('portfolios').insert({
      user_id: input.userId,
    })

    if (portfolioError) {
      await rollbackPartialProfile(admin, input.userId)
      return { success: false, error: portfolioError.message }
    }
  }

  return { success: true }
}

export async function bootstrapUserProfile(input: {
  userId: string
  email: string
  fullName: string
  investorTier: string
  referralCode?: string | null
}): Promise<{ success: boolean; error?: string }> {
  try {
    await enforceIpRateLimit('auth:signup')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message }
    }
    throw err
  }

  const admin = createAdminSupabaseClient()
  const keyIssue = getServiceRoleKeyIssue()
  if (!admin || keyIssue) {
    return {
      success: false,
      error:
        keyIssue === 'wrong-role' || keyIssue === 'same-as-anon'
          ? 'SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role secret from Supabase → Project Settings → API.'
          : 'Server profile setup is not configured. Add the real SUPABASE_SERVICE_ROLE_KEY to .env and run migration 005_signup_bootstrap.sql.',
    }
  }

  const referralCode = normalizeReferralCode(input.referralCode)

  const bootstrap = await bootstrapProfileAtomic(admin, {
    userId: input.userId,
    email: input.email,
    fullName: input.fullName,
    investorTier: input.investorTier,
  })

  if (!bootstrap.success) {
    return bootstrap
  }

  try {
    await ensureUserReferralCode(input.userId, input.fullName)
    await recordReferralForNewUser(input.userId, referralCode)
  } catch (err) {
    console.error('[bootstrap] referral setup failed', err)
  }

  return { success: true }
}
