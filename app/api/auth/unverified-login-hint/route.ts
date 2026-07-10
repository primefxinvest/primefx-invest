import { NextResponse, type NextRequest } from 'next/server'
import { enforceIpRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { requireAdminClient } from '@/lib/auth/verification-api'
import { isEmailVerified } from '@/lib/auth/require-verified-email'
import { mapVerificationErrorMessage } from '@/lib/auth/signup-errors'

/**
 * Soft hint for login UX when credentials fail.
 * Returns unverified=true only when the account exists and email is not confirmed.
 * Does not reveal whether an account exists otherwise.
 */
export async function POST(request: NextRequest) {
  try {
    await enforceIpRateLimit('auth:login')
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          success: true,
          message: 'OK',
          data: { unverified: false },
        },
        { status: 200 }
      )
    }
  }

  let body: { email?: string }
  try {
    body = (await request.json()) as { email?: string }
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

  const email = body.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({
      success: true,
      message: 'OK',
      data: { unverified: false },
    })
  }

  try {
    const { admin } = requireAdminClient()
    if (!admin) {
      return NextResponse.json({
        success: true,
        message: 'OK',
        data: { unverified: false },
      })
    }

    const { data: profile } = await admin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (!profile?.id) {
      return NextResponse.json({
        success: true,
        message: 'OK',
        data: { unverified: false },
      })
    }

    const { data, error } = await admin.auth.admin.getUserById(profile.id)
    if (error || !data?.user) {
      return NextResponse.json({
        success: true,
        message: 'OK',
        data: { unverified: false },
      })
    }

    const unverified = !isEmailVerified(data.user)
    console.info('[verification] login unverified hint', {
      email,
      unverified,
    })

    return NextResponse.json({
      success: true,
      message: unverified ? 'Email not verified.' : 'OK',
      data: {
        unverified,
        userId: unverified ? profile.id : undefined,
        email: unverified ? email : undefined,
      },
    })
  } catch (err) {
    console.error('[verification] unverified-login-hint failed', err)
    return NextResponse.json(
      {
        success: true,
        message: mapVerificationErrorMessage(err, 'OK'),
        data: { unverified: false },
      },
      { status: 200 }
    )
  }
}
