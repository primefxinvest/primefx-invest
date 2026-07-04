import 'server-only'

import { upsertVerificationSession, getVerificationSessionBySessionId } from './verification-sessions'
import { syncUserVerificationFromDidit } from './verification-sync'

export const DIDIT_SESSION_NOT_FOUND_STATUS = 'Expired' as const

export function buildSessionNotFoundDecision() {
  return {
    reason: 'session_not_found',
    source: 'didit_api',
    marked_at: new Date().toISOString(),
  }
}

/** Persist local expired status when Didit no longer has the session. */
export async function markDiditSessionNotFound(input: {
  sessionId: string
  userId?: string | null
}) {
  const decision = buildSessionNotFoundDecision()

  const record = await upsertVerificationSession({
    sessionId: input.sessionId,
    vendorData: input.userId ?? null,
    status: DIDIT_SESSION_NOT_FOUND_STATUS,
    decision,
    userId: input.userId ?? null,
  })

  if (input.userId) {
    await syncUserVerificationFromDidit({
      userId: input.userId,
      sessionId: input.sessionId,
      diditStatus: DIDIT_SESSION_NOT_FOUND_STATUS,
      decision,
      notify: false,
    })
  }

  return record ?? (await getVerificationSessionBySessionId(input.sessionId))
}
