import { NextResponse, type NextRequest } from 'next/server'
import { bootstrapUserProfile } from '@/lib/auth/bootstrap-profile'
import { mapSignupErrorMessage } from '@/lib/auth/signup-errors'

type BootstrapProfileBody = {
  userId?: string
  email?: string
  fullName?: string
  investorTier?: string
  referralCode?: string | null
}

export async function POST(request: NextRequest) {
  let body: BootstrapProfileBody
  try {
    body = (await request.json()) as BootstrapProfileBody
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
  const fullName = body.fullName?.trim()
  const investorTier = body.investorTier?.trim() || 'Starter'

  if (!userId || !email || !fullName) {
    return NextResponse.json(
      {
        success: false,
        message: 'userId, email, and fullName are required.',
        error: { code: 'MISSING_FIELDS' },
      },
      { status: 400 }
    )
  }

  try {
    const result = await bootstrapUserProfile({
      userId,
      email,
      fullName,
      investorTier,
      referralCode: body.referralCode ?? null,
    })

    if (!result.success) {
      console.error('[bootstrap] profile failed', {
        userId,
        code: result.code,
        error: result.error,
      })
      return NextResponse.json(
        {
          success: false,
          message: mapSignupErrorMessage(result.error ?? 'Profile creation failed.'),
          error: { code: result.code ?? 'BOOTSTRAP_FAILED', detail: result.error },
        },
        { status: 422 }
      )
    }

    console.info('[bootstrap] profile created', { userId })

    return NextResponse.json({
      success: true,
      message: 'Profile created successfully.',
      data: { userId },
    })
  } catch (err) {
    console.error('[bootstrap] unhandled error', err)
    return NextResponse.json(
      {
        success: false,
        message: 'Profile setup failed. Please try again.',
        error: { code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    )
  }
}
