import 'server-only'

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { verifyTotpCode } from '@/lib/auth/totp'
import { getServerMfaStatus, requireServerMfaEnabled } from '@/lib/auth/mfa-server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { INVESTOR_RULES } from '@/lib/investor/rules'
import { logSecurityAudit } from '@/lib/security/security-audit'

export type TransactionAuthAction =
  | 'withdrawal'
  | 'transfer'
  | 'payout'
  | 'capital_withdrawal'

export type TransactionAuthInput = {
  userId: string
  action: TransactionAuthAction
  /** Optional step-up TOTP code (Supabase MFA or future dedicated TOTP). */
  totpCode?: string | null
  /** Optional transaction PIN (4–8 digits). */
  transactionPin?: string | null
}

const PIN_SCRYPT_PREFIX = 'scrypt'

function hashTransactionPin(pin: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(pin, salt, 64)
  return `${PIN_SCRYPT_PREFIX}:${salt.toString('hex')}:${derived.toString('hex')}`
}

export function hashTransactionPinForStorage(pin: string): string {
  const normalized = pin.replace(/\D/g, '')
  if (normalized.length < 4 || normalized.length > 8) {
    throw new Error('Transaction PIN must be 4–8 digits.')
  }
  return hashTransactionPin(normalized)
}

function verifyTransactionPinHash(pin: string, stored: string): boolean {
  const normalized = pin.replace(/\D/g, '')
  const [prefix, saltHex, hashHex] = stored.split(':')
  if (prefix !== PIN_SCRYPT_PREFIX || !saltHex || !hashHex) return false

  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const derived = scryptSync(normalized, salt, expected.length)
    return timingSafeEqual(expected, derived)
  } catch {
    return false
  }
}

async function getStoredTransactionPinHash(userId: string): Promise<string | null> {
  const db = createAdminSupabaseClient()
  if (!db) return null

  const { data } = await db
    .from('users')
    .select('transaction_pin_hash')
    .eq('id', userId)
    .maybeSingle()

  const hash = data?.transaction_pin_hash
  return typeof hash === 'string' && hash.length > 0 ? hash : null
}

async function verifySupabaseStepUpTotp(totpCode: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const factor = factors?.totp?.find((entry) => entry.status === 'verified')
  if (!factor) return false

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
    factorId: factor.id,
  })
  if (challengeError || !challenge?.id) return false

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId: factor.id,
    challengeId: challenge.id,
    code: totpCode.replace(/\s/g, ''),
  })

  return !verifyError
}

/**
 * Future TOTP integration hook — verifies a dedicated server-stored TOTP secret
 * when Supabase MFA is not used.
 */
async function verifyDedicatedTotpSecret(userId: string, totpCode: string): Promise<boolean> {
  const db = createAdminSupabaseClient()
  if (!db) return false

  const { data } = await db
    .from('users')
    .select('totp_secret')
    .eq('id', userId)
    .maybeSingle()

  const secret = data?.totp_secret
  if (typeof secret !== 'string' || !secret.trim()) return false

  return verifyTotpCode(secret, totpCode)
}

async function verifyStepUpTotp(userId: string, totpCode: string): Promise<boolean> {
  const normalized = totpCode.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalized)) return false

  if (await verifySupabaseStepUpTotp(normalized)) return true
  return verifyDedicatedTotpSecret(userId, normalized)
}

function actionRequiresPin(action: TransactionAuthAction): boolean {
  if (action === 'transfer') {
    return INVESTOR_RULES.security.transactionPinRequiredForTransfers
  }
  return INVESTOR_RULES.security.twoFactorRequiredForWithdrawal
}

function actionRequiresMfa(action: TransactionAuthAction): boolean {
  if (action === 'transfer') {
    return INVESTOR_RULES.security.transactionPinRequiredForTransfers
  }
  return INVESTOR_RULES.security.twoFactorRequiredForWithdrawal
}

export async function requireTransactionAuthorization(
  input: TransactionAuthInput
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const totpCode = input.totpCode?.trim()
  const transactionPin = input.transactionPin?.trim()

  if (totpCode) {
    const totpValid = await verifyStepUpTotp(input.userId, totpCode)
    if (totpValid) {
      return { allowed: true }
    }
  }

  if (transactionPin) {
    const storedHash = await getStoredTransactionPinHash(input.userId)
    if (storedHash && verifyTransactionPinHash(transactionPin, storedHash)) {
      return { allowed: true }
    }
    if (storedHash) {
      await logSecurityAudit({
        eventType: 'transaction.pin_denied',
        userId: input.userId,
        metadata: { action: input.action },
      })
      return { allowed: false, error: 'Invalid transaction PIN.' }
    }
  }

  const mfaStatus = await getServerMfaStatus(input.userId)
  if (mfaStatus.bypassed) {
    const storedHash = await getStoredTransactionPinHash(input.userId)
    if (storedHash) {
      return {
        allowed: false,
        error: 'Enter your transaction PIN to authorize this action.',
      }
    }
    return { allowed: true }
  }

  if (actionRequiresMfa(input.action)) {
    const mfa = await requireServerMfaEnabled(input.userId)
    if (mfa.allowed) {
      return { allowed: true }
    }

    const storedHash = await getStoredTransactionPinHash(input.userId)
    if (storedHash && actionRequiresPin(input.action)) {
      return {
        allowed: false,
        error: 'Complete two-factor authentication or enter your transaction PIN.',
      }
    }

    return { allowed: false, error: mfa.error ?? 'Transaction authorization required.' }
  }

  return { allowed: true }
}

/** Convenience helper for server actions — optional step-up credentials. */
export type TransactionStepUpCredentials = {
  totpCode?: string | null
  transactionPin?: string | null
}

export async function assertTransactionAuthorized(
  userId: string,
  action: TransactionAuthAction,
  credentials?: TransactionStepUpCredentials
) {
  return requireTransactionAuthorization({
    userId,
    action,
    totpCode: credentials?.totpCode,
    transactionPin: credentials?.transactionPin,
  })
}

/** Non-secret fingerprint for audit correlation. */
export function fingerprintStepUpAttempt(input: TransactionStepUpCredentials | undefined) {
  if (!input?.totpCode && !input?.transactionPin) return null
  const payload = `${input.totpCode ?? ''}:${input.transactionPin ?? ''}`
  return createHash('sha256').update(payload).digest('hex').slice(0, 16)
}
