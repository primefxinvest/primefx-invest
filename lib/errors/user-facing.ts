/** Default message when an internal/technical error must not be shown to users. */
export const GENERIC_USER_ERROR =
  'We could not load this data. Please try again.'

const INTERNAL_MARKERS = [
  'supabase',
  'pgrst',
  'postgres',
  'postgresql',
  'service_role',
  'jwt',
  'row level security',
  'rls policy',
  'violates',
  'syntax error',
  'stack trace',
  'at object.',
  'at async',
  'econnrefused',
  'enotfound',
  'fetch failed',
  'networkerror',
  'unexpected token',
  'undefined is not',
  'cannot read propert',
  'null is not',
  'internal server error',
  '500',
  'api key',
  'apikey',
  'secret',
  'env.',
  'process.env',
  'nowpayments_api',
  'binancepay_',
  'didit_',
  'gemini_api',
  'google_api',
]

const USER_FRIENDLY_PATTERNS = [
  /^minimum/i,
  /^maximum/i,
  /^insufficient/i,
  /^please /i,
  /^enter /i,
  /^you /i,
  /^your /i,
  /^we could not/i,
  /^this /i,
  /^withdrawal/i,
  /^deposit/i,
  /^investment/i,
  /^not authenticated/i,
  /^session expired/i,
  /^request timed out/i,
  /^verification/i,
  /^kyc/i,
]

function normalizeError(err: unknown): string {
  if (err instanceof Error) return err.message.trim()
  if (typeof err === 'string') return err.trim()
  return ''
}

/**
 * Sanitize errors before displaying in the UI.
 * Preserves short, user-intended messages; blocks technical/internal details.
 */
export function toUserFacingError(
  err: unknown,
  fallback = GENERIC_USER_ERROR
): string {
  const message = normalizeError(err)
  if (!message) return fallback

  if (message.length > 220) return fallback

  const lower = message.toLowerCase()

  if (INTERNAL_MARKERS.some((marker) => lower.includes(marker))) {
    return fallback
  }

  if (message.includes('\n') || message.includes(' at ')) {
    return fallback
  }

  if (USER_FRIENDLY_PATTERNS.some((pattern) => pattern.test(message))) {
    return message
  }

  // Short plain messages without technical markers are likely intentional
  if (message.length <= 120 && !/[{}[\]<>]/.test(message)) {
    return message
  }

  return fallback
}
