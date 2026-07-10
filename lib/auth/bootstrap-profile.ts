'use server'

import { createAdminSupabaseClient, getServiceRoleKeyIssue } from '@/lib/supabase/admin-server'
import {
  ensureUserReferralCode,
  normalizeReferralCode,
  recordReferralForNewUser,
} from '@/lib/referral/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { checkBootstrapRpcExists, sleep, waitForAuthUser } from '@/lib/auth/signup-session'

const AUTH_USER_RETRY_ATTEMPTS = 4
const AUTH_USER_RETRY_DELAY_MS = 250

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
): Promise<{ success: boolean; error?: string; code?: string }> {
  const rpcCheck = await checkBootstrapRpcExists(admin)
  if (!rpcCheck.exists) {
    console.error('[bootstrap] migration 046 missing', rpcCheck.error)
    return { success: false, error: rpcCheck.error, code: 'MIGRATION_046_MISSING' }
  }

  const authUser = await waitForAuthUser(admin, input.userId)
  if (!authUser) {
    const message = `auth.users record not found for id ${input.userId} after signup.`
    console.error('[bootstrap] auth user missing before bootstrap', { userId: input.userId })
    return { success: false, error: message, code: 'AUTH_USER_NOT_FOUND' }
  }

  for (let attempt = 0; attempt < AUTH_USER_RETRY_ATTEMPTS; attempt += 1) {
    const { data, error } = await admin.rpc('bootstrap_user_profile_atomic', {
      p_user_id: input.userId,
      p_email: input.email,
      p_full_name: input.fullName,
      p_investor_tier: input.investorTier,
    })

    if (error) {
      console.error('[bootstrap] rpc error', {
        userId: input.userId,
        attempt,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })

      if (
        error.message.includes('bootstrap_user_profile_atomic') &&
        (error.message.includes('Could not find') || error.message.includes('does not exist'))
      ) {
        return bootstrapProfileFallback(admin, input)
      }

      return { success: false, error: error.message, code: error.code ?? 'RPC_ERROR' }
    }

    const result = data as { success?: boolean; error?: string } | null
    if (result?.success) {
      return { success: true }
    }

    const code = result?.error
    console.error('[bootstrap] rpc returned failure', {
      userId: input.userId,
      attempt,
      code,
    })

    if (code === 'AUTH_USER_NOT_FOUND' && attempt < AUTH_USER_RETRY_ATTEMPTS - 1) {
      await sleep(AUTH_USER_RETRY_DELAY_MS)
      continue
    }

    return {
      success: false,
      error: code ?? 'Profile bootstrap failed.',
      code: code ?? 'BOOTSTRAP_FAILED',
    }
  }

  return {
    success: false,
    error: `auth.users record not found for id ${input.userId} after signup.`,
    code: 'AUTH_USER_NOT_FOUND',
  }
}

async function bootstrapProfileFallback(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  input: {
    userId: string
    email: string
    fullName: string
    investorTier: string
  }
): Promise<{ success: boolean; error?: string; code?: string }> {
  console.warn('[bootstrap] using fallback path (migration 046 rpc unavailable)', {
    userId: input.userId,
  })

  const authUser = await waitForAuthUser(admin, input.userId)
  if (!authUser) {
    const message = `auth.users record not found for id ${input.userId} after signup.`
    console.error('[bootstrap] fallback auth user missing', { userId: input.userId })
    return { success: false, error: message, code: 'AUTH_USER_NOT_FOUND' }
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
    console.error('[bootstrap] users upsert failed', {
      userId: input.userId,
      message: userError.message,
      code: userError.code,
      details: userError.details,
    })
    return { success: false, error: userError.message, code: userError.code ?? 'USERS_UPSERT_FAILED' }
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
    console.error('[bootstrap] wallet upsert failed', {
      userId: input.userId,
      message: walletError.message,
      code: walletError.code,
    })
    return { success: false, error: walletError.message, code: walletError.code ?? 'WALLET_UPSERT_FAILED' }
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
      console.error('[bootstrap] portfolio insert failed', {
        userId: input.userId,
        message: portfolioError.message,
        code: portfolioError.code,
      })
      return {
        success: false,
        error: portfolioError.message,
        code: portfolioError.code ?? 'PORTFOLIO_INSERT_FAILED',
      }
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
}): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    await enforceIpRateLimit('auth:signup')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return { success: false, error: err.message, code: 'RATE_LIMIT_EXCEEDED' }
    }
    console.error('[bootstrap] unexpected error', err)
    return {
      success: false,
      error: 'Profile setup failed. Please try again.',
      code: 'INTERNAL_ERROR',
    }
  }

  const admin = createAdminSupabaseClient()
  const keyIssue = getServiceRoleKeyIssue()
  if (!admin || keyIssue) {
    const error =
      keyIssue === 'wrong-role' || keyIssue === 'same-as-anon'
        ? 'SUPABASE_SERVICE_ROLE_KEY is set to the anon key. Use the service_role secret from Supabase → Project Settings → API.'
        : 'Server profile setup is not configured. Add SUPABASE_SERVICE_ROLE_KEY to the server environment.'
    console.error('[bootstrap] service role misconfigured', { keyIssue })
    return { success: false, error, code: keyIssue ?? 'SERVICE_ROLE_MISSING' }
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
    console.error('[bootstrap] referral setup failed (non-blocking)', {
      userId: input.userId,
      err,
    })
  }

  return { success: true }
}
