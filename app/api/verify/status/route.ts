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
import { upsertVerificationSession } from '@/lib/didit/verification-sessions'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { assertDiditSessionOwnedByUser } from '@/lib/security/kyc-session-guard'
import { enforceUserRateLimit, RateLimitExceededError } from '@/lib/security/rate-limit'
import { logSecurityAudit } from '@/lib/security/security-audit'

export const runtime = 'nodejs'

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

  const sessionId = getVerificationSessionIdFromSearchParams(new URL(request.url).searchParams)
  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  const adminDb = createAdminSupabaseClient()
  if (!adminDb) {
    return NextResponse.json({ error: 'Verification service is not configured.' }, { status: 503 })
  }

  const { data: profile } = await adminDb
    .from('users')
    .select('didit_session_id, is_verified, verification_status, kyc_status')
    .eq('id', user.id)
    .maybeSingle()

  try {
    const apiResponse = await fetchDiditSessionDecision(sessionId)
    const ownership = await assertDiditSessionOwnedByUser({
      sessionId,
      userId: user.id,
      adminDb,
      diditApiResponse: apiResponse as Record<string, unknown>,
    })

    if (!ownership.ok) {
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

    if (profile?.didit_session_id !== sessionId) {
      await adminDb
        .from('users')
        .update({ didit_session_id: sessionId })
        .eq('id', user.id)
    }

    const terminalStatuses = ['Approved', 'Declined', 'Expired', 'KYC Expired']
    const mappedVerificationStatus = mapDiditStatusToVerificationStatus(diditStatus)

    if (
      terminalStatuses.includes(diditStatus) &&
      profile?.verification_status === mappedVerificationStatus
    ) {
      return NextResponse.json({
        sessionId,
        diditStatus,
        verificationStatus: mappedVerificationStatus,
        isVerified: Boolean(profile?.is_verified),
        kycStatus: profile?.kyc_status ?? 'Pending',
      })
    }

    if (terminalStatuses.includes(diditStatus)) {
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
      })
    }

    return NextResponse.json({
      sessionId,
      diditStatus,
      verificationStatus:
        profile?.verification_status ??
        mapDiditStatusToVerificationStatus(diditStatus),
      isVerified: Boolean(profile?.is_verified),
      kycStatus: profile?.kyc_status ?? 'Pending',
      pending: true,
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
        kycStatus: profile?.kyc_status ?? 'Pending',
        sessionNotFound: true,
        message: getDiditSessionNotFoundUserMessage(),
      })
    }

    console.error('[verify/status]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch verification status' },
      { status: 500 }
    )
  }
}
