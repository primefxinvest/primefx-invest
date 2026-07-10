import { NextResponse, type NextRequest } from 'next/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { recordVerificationEmailSent } from '@/lib/auth/verification-api'
import { mapVerificationErrorMessage } from '@/lib/auth/signup-errors'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export async function POST(request: NextRequest) {
  try {
    await enforceIpRateLimit('auth:signup')
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

  let body: { userId?: string }
  try {
    body = (await request.json()) as { userId?: string }
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
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: 'userId is required.',
        error: { code: 'MISSING_FIELDS' },
      },
      { status: 400 }
    )
  }

  try {
    if (!createAdminSupabaseClient()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server auth is not configured.',
          error: { code: 'SERVICE_ROLE_MISSING' },
        },
        { status: 503 }
      )
    }

    await recordVerificationEmailSent(userId)
    console.info('[verification] recorded verification email sent', { userId })

    return NextResponse.json({
      success: true,
      message: 'Verification email timestamp recorded.',
      data: { userId },
    })
  } catch (err) {
    console.error('[verification] record-sent unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: mapVerificationErrorMessage(err, 'Could not record verification email.'),
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
