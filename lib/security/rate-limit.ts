import 'server-only'

import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number

  constructor(message = 'Too many requests. Please try again later.', retryAfterSeconds = 60) {
    super(message)
    this.name = 'RateLimitExceededError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export type RateLimitScope =
  | 'auth:login'
  | 'auth:signup'
  | 'chat'
  | 'deposit'
  | 'withdrawal'
  | 'transfer'
  | 'referral:claim'
  | 'kyc:start'
  | 'kyc:status'
  | 'kyc:extract'

const RATE_LIMITS: Record<
  RateLimitScope,
  { maxHits: number; windowSeconds: number; message: string }
> = {
  'auth:login': { maxHits: 20, windowSeconds: 60, message: 'Too many sign-in attempts. Try again shortly.' },
  'auth:signup': { maxHits: 10, windowSeconds: 60, message: 'Too many sign-up attempts. Try again shortly.' },
  chat: { maxHits: 40, windowSeconds: 3600, message: 'PrimeAI rate limit reached. Try again later.' },
  deposit: { maxHits: 15, windowSeconds: 3600, message: 'Too many deposit attempts. Try again later.' },
  withdrawal: { maxHits: 10, windowSeconds: 3600, message: 'Too many withdrawal attempts. Try again later.' },
  transfer: { maxHits: 20, windowSeconds: 3600, message: 'Too many transfer attempts. Try again later.' },
  'referral:claim': { maxHits: 10, windowSeconds: 3600, message: 'Too many referral requests. Try again later.' },
  'kyc:start': { maxHits: 5, windowSeconds: 3600, message: 'Too many verification starts. Try again later.' },
  'kyc:status': { maxHits: 120, windowSeconds: 3600, message: 'Too many verification checks. Try again later.' },
  'kyc:extract': { maxHits: 15, windowSeconds: 3600, message: 'Too many document scans. Try again later.' },
}

export async function getRequestIp(): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return headerStore.get('x-real-ip')?.trim() || 'unknown'
}

function buildBucketKey(scope: RateLimitScope, subject: string) {
  return `${scope}:${subject}`
}

export async function enforceRateLimit(input: {
  scope: RateLimitScope
  subject: string
}) {
  const config = RATE_LIMITS[input.scope]
  const db = createAdminSupabaseClient()

  if (!db) {
    return
  }

  const bucketKey = buildBucketKey(input.scope, input.subject)
  const { data: allowed, error } = await db.rpc('consume_rate_limit', {
    p_bucket_key: bucketKey,
    p_max_hits: config.maxHits,
    p_window_seconds: config.windowSeconds,
  })

  if (error) {
    console.error('[rate-limit]', error.message)
    return
  }

  if (!allowed) {
    throw new RateLimitExceededError(config.message, config.windowSeconds)
  }
}

export async function enforceUserRateLimit(scope: RateLimitScope, userId: string) {
  await enforceRateLimit({ scope, subject: userId })
}

export async function enforceIpRateLimit(scope: RateLimitScope, ip?: string) {
  const resolvedIp = ip ?? (await getRequestIp())
  await enforceRateLimit({ scope, subject: resolvedIp })
}

export function rateLimitResponse(error: RateLimitExceededError) {
  return Response.json(
    { error: error.message, code: 'RATE_LIMIT_EXCEEDED' },
    {
      status: 429,
      headers: {
        'Retry-After': String(error.retryAfterSeconds),
      },
    }
  )
}
