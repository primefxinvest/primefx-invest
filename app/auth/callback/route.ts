import { NextResponse, type NextRequest } from 'next/server'
import { bootstrapUserProfile } from '@/lib/auth/bootstrap-profile'
import { sanitizeRedirectPath } from '@/lib/auth/session'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import {
  createRouteHandlerSupabaseClient,
  getRequestOrigin,
} from '@/lib/supabase/route-handler'

function loginErrorRedirect(request: NextRequest, code: string, message?: string) {
  const loginUrl = new URL('/login', getRequestOrigin(request))
  loginUrl.searchParams.set('error', code)
  if (message) {
    loginUrl.searchParams.set('message', message.slice(0, 240))
  }
  return NextResponse.redirect(loginUrl)
}

function emailVerificationFailedRedirect(
  request: NextRequest,
  status: 'failed' | 'expired' | 'already_verified'
) {
  const url = new URL('/auth/confirm-email', getRequestOrigin(request))
  url.searchParams.set('emailVerification', status)
  return url
}

export async function GET(request: NextRequest) {
  try {
    await enforceIpRateLimit('auth:login')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return loginErrorRedirect(request, 'rate_limited', err.message)
    }
    throw err
  }

  const { searchParams } = request.nextUrl
  const providerError = searchParams.get('error')
  const providerErrorDescription = searchParams.get('error_description')

  if (providerError) {
    return loginErrorRedirect(
      request,
      'oauth_failed',
      providerErrorDescription ?? providerError
    )
  }

  const code = searchParams.get('code')
  const nextPath = sanitizeRedirectPath(searchParams.get('redirect'))
  const isEmailVerificationFlow = searchParams.get('verify') === '1'

  if (!code) {
    return loginErrorRedirect(request, 'oauth_missing_code')
  }

  const successUrl = new URL(
    isEmailVerificationFlow ? sanitizeRedirectPath(searchParams.get('redirect') || '/dashboard') : nextPath,
    getRequestOrigin(request)
  )
  const { supabase, applyCookiesTo } = createRouteHandlerSupabaseClient(
    request,
    () => NextResponse.redirect(successUrl)
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[session] exchangeCodeForSession failed', {
      message: error.message,
      isEmailVerificationFlow,
    })
    const message = error.message.toLowerCase()
    if (isEmailVerificationFlow) {
      const status = message.includes('expired')
        ? 'expired'
        : message.includes('already')
          ? 'already_verified'
          : 'failed'
      return applyCookiesTo(
        NextResponse.redirect(emailVerificationFailedRedirect(request, status))
      )
    }
    return loginErrorRedirect(request, 'oauth_failed', error.message)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.email) {
    const metadata = user.user_metadata ?? {}
    try {
      await bootstrapUserProfile({
        userId: user.id,
        email: user.email,
        fullName:
          (metadata.full_name as string | undefined) ??
          (metadata.name as string | undefined) ??
          user.email.split('@')[0] ??
          'Investor',
        investorTier: (metadata.investor_tier as string | undefined) ?? 'Starter',
      })
    } catch (bootstrapError) {
      // Profile may already exist from signup bootstrap — do not block sign-in.
      console.warn('[bootstrap] callback bootstrap non-fatal', bootstrapError)
    }
  }

  if (isEmailVerificationFlow) {
    console.info('[verification] email confirmed via callback', {
      userId: user?.id,
      emailConfirmedAt: user?.email_confirmed_at,
    })
    const dashboardUrl = new URL('/dashboard', getRequestOrigin(request))
    return applyCookiesTo(NextResponse.redirect(dashboardUrl))
  }

  return applyCookiesTo(NextResponse.redirect(successUrl))
}
