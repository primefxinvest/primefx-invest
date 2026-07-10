/**
 * Maps raw Supabase / bootstrap / network errors to friendly signup messages.
 * Never returns "{}" or empty strings.
 */

const FALLBACK = 'Signup failed. Please try again.'

function firstNonEmptyString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed && trimmed !== '{}' && trimmed !== '[object Object]') {
        return trimmed
      }
    }
  }
  return null
}

/** Coerce any thrown/API value into a safe display string (never "{}" / objects). */
export function ensureErrorMessage(value: unknown, fallback = FALLBACK): string {
  if (value instanceof Error) {
    return mapSignupErrorMessage(value.message) || fallback
  }

  if (typeof value === 'string') {
    return mapSignupErrorMessage(value) || fallback
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const nested =
      firstNonEmptyString(
        record.message,
        record.error,
        record.detail,
        typeof record.error === 'object' && record.error
          ? (record.error as Record<string, unknown>).message
          : null,
        typeof record.error === 'object' && record.error
          ? (record.error as Record<string, unknown>).detail
          : null
      ) ?? null

    if (nested) {
      return mapSignupErrorMessage(nested) || fallback
    }
  }

  return fallback
}

export function mapSignupErrorMessage(raw: string): string {
  const message = raw.trim()
  if (!message || message === '{}' || message === '[object Object]') {
    return FALLBACK
  }

  const lower = message.toLowerCase()

  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('user already exists') ||
    lower.includes('email address is already') ||
    lower.includes('already exists')
  ) {
    return 'An account with this email already exists. Please sign in instead.'
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('short') ||
      lower.includes('at least') ||
      lower.includes('too short') ||
      lower.includes('least 6'))
  ) {
    return 'Password is too weak. Use at least 6 characters.'
  }

  if (
    lower.includes('invalid email') ||
    lower.includes('email format') ||
    lower.includes('valid email') ||
    lower.includes('unable to validate email')
  ) {
    return 'Please enter a valid email address.'
  }

  if (
    lower.includes('rate limit') ||
    lower.includes('too many') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate limit')
  ) {
    return 'Too many attempts. Please wait a moment and try again.'
  }

  if (
    lower.includes('database') ||
    lower.includes('connection') ||
    lower.includes('unavailable') ||
    lower.includes('migration 046') ||
    lower.includes('service_role') ||
    lower.includes('service role') ||
    lower.includes('pgrst') ||
    lower.includes('could not find the function')
  ) {
    return 'Database temporarily unavailable. Please try again in a moment.'
  }

  if (
    lower.includes('error sending') ||
    lower.includes('confirmation email') ||
    lower.includes('verification email') ||
    lower.includes('error sending confirmation') ||
    lower.includes('smtp') ||
    lower.includes('mail')
  ) {
    return 'We could not send the verification email. Please try resending from the confirm email page.'
  }

  if (lower.includes('unexpected response was received from the server')) {
    return 'Signup service is temporarily unavailable. Please try again in a moment.'
  }

  if (
    lower.includes('unexpected response') ||
    lower.includes('unknown error') ||
    lower.includes('internal server error') ||
    lower === 'error' ||
    lower === 'failed'
  ) {
    return FALLBACK
  }

  if (lower.includes('network') || lower.includes('fetch failed')) {
    return 'Network error. Check your connection and try again.'
  }

  // Avoid dumping opaque JSON / codes as the only UI message
  if (
    message === 'Registration failed' ||
    message === 'Registration failed. Please try again.' ||
    /^registration failed/i.test(message)
  ) {
    return FALLBACK
  }

  return message
}

export function mapVerificationErrorMessage(raw: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return ensureErrorMessage(raw, fallback)
}
