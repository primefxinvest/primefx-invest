import { NextResponse, type NextRequest } from 'next/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import {
  getAuthUserVerificationState,
  getVerificationEmailRedirectUrl,
  recordVerificationEmailSent,
  sendSignupVerificationEmail,
} from '@/lib/auth/verification-api'
import { mapVerificationErrorMessage } from '@/lib/auth/signup-errors'
import { getRequestOrigin } from '@/lib/supabase/route-handler'

export async function POST(request: NextRequest) {
  try {
    await enforceIpRateLimit('email:resend')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          success: false,
          message: err.message,
          error: { code: 'RATE_LIMIT_EXCEEDED' },
          data: { retryAfterSeconds: err.retryAfterSeconds },
        },
        { status: 429 }
      )
    }
  }

  let body: { userId?: string; email?: string }
  try {
    body = (await request.json()) as { userId?: string; email?: string }
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid request body.',
        error: { code: 'INVALID_BODY' },
      },
      { status: 400 }
    )
  }

  const userId = body.userId?.trim()
  const email = body.email?.trim()

  if (!userId || !email) {
    return NextResponse.json(
      {
        success: false,
        message: 'userId and email are required.',
        error: { code: 'MISSING_FIELDS' },
      },
      { status: 400 }
    )
  }

  try {
    const state = await getAuthUserVerificationState(userId, email)
    if (!state.success) {
      return NextResponse.json(
        {
          success: false,
          message: mapVerificationErrorMessage(state.error),
          error: { code: state.code, detail: state.error },
        },
        { status: 422 }
      )
    }

    if (state.verified) {
      return NextResponse.json({
        success: true,
        message: 'Your email is already verified.',
        data: { verified: true, email: state.email },
      })
    }

    const redirectTo = getVerificationEmailRedirectUrl(getRequestOrigin(request))
    const sent = await sendSignupVerificationEmail({
      email: state.email,
      redirectTo,
    })

    if (!sent.success) {
      return NextResponse.json(
        {
          success: false,
          message: mapVerificationErrorMessage(
            sent.error,
            'Verification email failed. Please try again.'
          ),
          error: { code: sent.code, detail: sent.error },
        },
        { status: 422 }
      )
    }

    await recordVerificationEmailSent(userId)
    console.info('[verification] resend succeeded', { userId, email: state.email })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
      data: { email: state.email, verified: false },
    })
  } catch (err) {
    console.error('[verification] resend unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: mapVerificationErrorMessage(err, 'Verification email failed.'),
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
