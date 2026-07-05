import { NextResponse } from 'next/server'
import { getVerificationSessionIdFromSearchParams } from '@/lib/didit/callback-params'
import { fetchDiditSessionDecision } from '@/lib/didit/client'
import {
  resolveDiditDecisionPayload,
  resolveDiditSessionStatus,
  resolveDiditVendorData,
  resolveDiditWorkflowId,
} from '@/lib/didit/decision-normalize'
import {
  getDiditSessionNotFoundUserMessage,
  isDiditSessionNotFoundError,
} from '@/lib/didit/errors'
import { markDiditSessionNotFound } from '@/lib/didit/session-not-found'
import {
  mapDiditStatusToVerificationStatus,
  syncUserVerificationFromDidit,
} from '@/lib/didit/verification-sync'
import {
  getVerificationSessionBySessionId,
  upsertVerificationSession,
} from '@/lib/didit/verification-sessions'
import { isUserVerifiedInProfile } from '@/lib/investor/kyc'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertDiditSessionOwnedByUser } from '@/lib/security/kyc-session-guard'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { logSecurityAudit } from '@/lib/security/security-audit'

export const runtime = 'nodejs'

type UserVerificationProfile = {
  didit_session_id: string | null
  is_verified: boolean | null
  verification_status: string | null
  kyc_status: string | null
}

const TERMINAL_DIDIT_STATUSES = ['Approved', 'Declined', 'Expired', 'KYC Expired']

function mapVerificationStatusToDiditStatus(
  verificationStatus: string | null | undefined
): string {
  switch (String(verificationStatus ?? '').toLowerCase()) {
    case 'approved':
      return 'Approved'
    case 'declined':
      return 'Declined'
    case 'expired':
      return 'Expired'
    case 'pending_review':
      return 'In Review'
    case 'in_progress':
      return 'In Progress'
    case 'abandoned':
      return 'Abandoned'
    default:
      return 'In Progress'
  }
}

async function buildDatabaseStatusResponse(input: {
  profile: UserVerificationProfile
  sessionId?: string
  pending?: boolean
}) {
  const { profile, sessionId, pending } = input
  const resolvedSessionId = sessionId ?? profile.didit_session_id ?? ''
  const verificationStatus = String(profile.verification_status ?? 'pending').toLowerCase()

  let diditStatus = mapVerificationStatusToDiditStatus(profile.verification_status)
  if (resolvedSessionId) {
    const storedSession = await getVerificationSessionBySessionId(resolvedSessionId)
    if (storedSession?.status) {
      diditStatus = storedSession.status
    }
  }

  return NextResponse.json({
    sessionId: resolvedSessionId,
    diditStatus,
    verificationStatus,
    isVerified: isUserVerifiedInProfile(profile),
    kycStatus: profile.kyc_status ?? 'Pending',
    source: 'database',
    ...(pending ? { pending: true } : {}),
  })
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await enforceUserRateLimit('kyc:status', user.id)
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json({ error: err.message, code: 'RATE_LIMIT_EXCEEDED' }, { status: 429 })
    }
    throw err
  }

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) {
    return NextResponse.json({ error: 'Verification service is not configured.' }, { status: 503 })
  }

  const querySessionId = getVerificationSessionIdFromSearchParams(
    new URL(request.url).searchParams
  )

  const { data: profile } = await adminDb
    .from('users')
    .select('didit_session_id, is_verified, verification_status, kyc_status')
    .eq('id', user.id)
    .maybeSingle()

  const userProfile = (profile ?? {
    didit_session_id: null,
    is_verified: false,
    verification_status: 'pending',
    kyc_status: 'Pending',
  }) as UserVerificationProfile

  // Source of truth: webhook-synced database status takes priority over callback params.
  if (isUserVerifiedInProfile(userProfile)) {
    return buildDatabaseStatusResponse({
      profile: userProfile,
      sessionId: querySessionId || userProfile.didit_session_id || undefined,
    })
  }

  const terminalVerificationStatus = ['declined', 'expired'].includes(
    String(userProfile.verification_status ?? '').toLowerCase()
  )
  if (terminalVerificationStatus && !querySessionId) {
    return buildDatabaseStatusResponse({ profile: userProfile })
  }

  const sessionId = querySessionId || userProfile.didit_session_id || ''
  if (!sessionId) {
    return buildDatabaseStatusResponse({ profile: userProfile, pending: true })
  }

  try {
    const apiResponse = await fetchDiditSessionDecision(sessionId)
    const ownership = await assertDiditSessionOwnedByUser({
      sessionId,
      userId: user.id,
      adminDb,
      diditApiResponse: apiResponse as Record<string, unknown>,
    })

    if (!ownership.ok) {
      // Webhook may have already approved the user while callback carries a stale session id.
      if (isUserVerifiedInProfile(userProfile)) {
        return buildDatabaseStatusResponse({
          profile: userProfile,
          sessionId,
        })
      }

      await logSecurityAudit({
        eventType: 'kyc.session_ownership_denied',
        userId: user.id,
        resourceId: sessionId,
        metadata: { reason: ownership.reason },
      })
      return NextResponse.json({ error: ownership.reason }, { status: 403 })
    }

    const vendorData = resolveDiditVendorData(apiResponse)
    const diditStatus = resolveDiditSessionStatus(apiResponse)
    const decisionPayload = resolveDiditDecisionPayload(apiResponse)

    await upsertVerificationSession({
      sessionId,
      vendorData: vendorData ?? user.id,
      status: diditStatus,
      decision: decisionPayload,
      workflowId: resolveDiditWorkflowId(apiResponse),
      userId: user.id,
    })

    if (userProfile.didit_session_id !== sessionId) {
      await adminDb
        .from('users')
        .update({ didit_session_id: sessionId })
        .eq('id', user.id)
    }

    const mappedVerificationStatus = mapDiditStatusToVerificationStatus(diditStatus)

    if (
      TERMINAL_DIDIT_STATUSES.includes(diditStatus) &&
      userProfile.verification_status === mappedVerificationStatus
    ) {
      return NextResponse.json({
        sessionId,
        diditStatus,
        verificationStatus: mappedVerificationStatus,
        isVerified: Boolean(userProfile.is_verified),
        kycStatus: userProfile.kyc_status ?? 'Pending',
        source: 'database',
      })
    }

    if (TERMINAL_DIDIT_STATUSES.includes(diditStatus)) {
      const synced = await syncUserVerificationFromDidit({
        userId: user.id,
        sessionId,
        diditStatus,
        decision: decisionPayload,
      })

      await logSecurityAudit({
        eventType: 'kyc.verification_synced',
        userId: user.id,
        resourceId: sessionId,
        metadata: {
          diditStatus,
          verificationStatus: synced.verificationStatus,
          isVerified: synced.isVerified,
        },
      })

      return NextResponse.json({
        sessionId,
        diditStatus,
        verificationStatus: synced.verificationStatus,
        isVerified: synced.isVerified,
        kycStatus: synced.kycStatus,
        source: 'didit_api',
      })
    }

    return NextResponse.json({
      sessionId,
      diditStatus,
      verificationStatus:
        userProfile.verification_status ?? mapDiditStatusToVerificationStatus(diditStatus),
      isVerified: Boolean(userProfile.is_verified),
      kycStatus: userProfile.kyc_status ?? 'Pending',
      pending: true,
      source: 'didit_api',
    })
  } catch (err) {
    if (isDiditSessionNotFoundError(err)) {
      await markDiditSessionNotFound({
        sessionId: err.sessionId,
        userId: user.id,
      })

      return NextResponse.json({
        sessionId: err.sessionId,
        diditStatus: 'Expired',
        verificationStatus: 'expired',
        isVerified: false,
        kycStatus: userProfile.kyc_status ?? 'Pending',
        sessionNotFound: true,
        message: getDiditSessionNotFoundUserMessage(),
        source: 'didit_api',
      })
    }

    console.error('[verify/status]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch verification status' },
      { status: 500 }
    )
  }
}
