/** Didit redirect query params (callback URL varies by Didit version). */
const SESSION_ID_KEYS = [
  'verificationSessionId',
  'verification_session_id',
  'session_id',
  'sessionId',
] as const

type SearchParamSource =
  | URLSearchParams
  | Readonly<Record<string, string | string[] | undefined>>
  | null
  | undefined

function readParam(source: SearchParamSource, key: string): string {
  if (!source) return ''

  if (source instanceof URLSearchParams) {
    return source.get(key)?.trim() ?? ''
  }

  const value = source[key]
  if (Array.isArray(value)) return value[0]?.trim() ?? ''
  return typeof value === 'string' ? value.trim() : ''
}

export function getVerificationSessionIdFromSearchParams(source: SearchParamSource): string {
  for (const key of SESSION_ID_KEYS) {
    const value = readParam(source, key)
    if (value) return value
  }
  return ''
}

export function getDiditCallbackStatus(source: SearchParamSource): string {
  return readParam(source, 'status')
}

export function mapDiditCallbackStatusToVerificationStatus(
  status: string | null | undefined
): 'approved' | 'declined' | 'expired' | 'pending' | null {
  if (!status) return null
  const normalized = status.trim().toLowerCase()
  if (normalized === 'approved') return 'approved'
  if (normalized === 'declined') return 'declined'
  if (normalized === 'expired' || normalized === 'kyc expired') return 'expired'
  return 'pending'
}
