export const DIDIT_SESSION_NOT_FOUND_CODE = 'DIDIT_SESSION_NOT_FOUND' as const

export class DiditSessionNotFoundError extends Error {
  readonly code = DIDIT_SESSION_NOT_FOUND_CODE
  readonly sessionId: string

  constructor(sessionId: string) {
    super(
      `Didit verification session ${sessionId} was not found. It may have expired, been replaced, or removed from Didit.`
    )
    this.name = 'DiditSessionNotFoundError'
    this.sessionId = sessionId
  }
}

export function isDiditSessionNotFoundError(err: unknown): err is DiditSessionNotFoundError {
  return err instanceof DiditSessionNotFoundError
}

export function getDiditSessionNotFoundUserMessage(): string {
  return 'This verification session is no longer available. It may have expired or been replaced. Please start a new verification from your profile.'
}

export function getDiditSessionNotFoundAdminMessage(): string {
  return 'Session not found in Didit — marked as expired for tracking. The user can start a new verification session.'
}
