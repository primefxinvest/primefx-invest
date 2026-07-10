import { NextResponse, type NextRequest } from 'next/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { getAuthUserVerificationState } from '@/lib/auth/verification-api'
import { mapVerificationErrorMessage } from '@/lib/auth/signup-errors'

export async function POST(request: NextRequest) {
  try {
    await enforceIpRateLimit('auth:verification-status')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          success: false,
          message: err.message,
          error: { code: 'RATE_LIMIT_EXCEEDED' },
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

    console.info('[verification] status check', {
      userId,
      verified: state.verified,
      emailConfirmedAt: state.emailConfirmedAt,
    })

    return NextResponse.json({
      success: true,
      message: state.verified ? 'Email verified.' : 'Email not verified yet.',
      data: {
        verified: state.verified,
        email: state.email,
        emailConfirmedAt: state.emailConfirmedAt,
        // Alias for clients expecting email_verified_at naming
        email_verified_at: state.emailConfirmedAt,
      },
    })
  } catch (err) {
    console.error('[verification] status unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: mapVerificationErrorMessage(err, 'Could not check verification status.'),
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
