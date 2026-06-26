import { getCurrentUser, supabase } from '@/lib/supabase'
import { createTotpSetup, verifyTotpCode } from '@/lib/auth/totp'
import {
  clearMfaSessionVerified,
  isMfaSessionVerified,
  markMfaSessionVerified,
} from '@/lib/auth/mfa-session'
import { logProfileActivity } from '@/lib/profile/actions'

const LOCAL_2FA_PREFIX = 'primefx_2fa_'

async function isMfaBypassedForUser(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('users')
    .select('mfa_disabled_at')
    .eq('id', userId)
    .maybeSingle()

  return Boolean(data?.mfa_disabled_at)
}

export type MfaProvider = 'supabase' | 'local'

export interface MfaStatus {
  enabled: boolean
  provider: MfaProvider | null
  factorId?: string
}

export interface MfaEnrollment {
  provider: MfaProvider
  factorId?: string
  qrCode?: string
  secret: string
  uri?: string
}

interface LocalMfaRecord {
  enabled: boolean
  secret: string
  provider: 'local'
}

function getLocalMfa(userId: string): LocalMfaRecord | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`${LOCAL_2FA_PREFIX}${userId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as LocalMfaRecord
  } catch {
    return null
  }
}

function saveLocalMfa(userId: string, record: LocalMfaRecord | null) {
  if (typeof window === 'undefined') return
  if (!record) {
    localStorage.removeItem(`${LOCAL_2FA_PREFIX}${userId}`)
    return
  }
  localStorage.setItem(`${LOCAL_2FA_PREFIX}${userId}`, JSON.stringify(record))
}

async function syncTwoFactorMetadata(enabled: boolean) {
  await supabase.auth.updateUser({
    data: { two_factor_enabled: enabled },
  })
  window.dispatchEvent(new CustomEvent('primefx:profile-updated'))
}

export async function getMfaStatus(): Promise<MfaStatus> {
  const { data: authUser } = await getCurrentUser()
  if (!authUser) {
    return { enabled: false, provider: null }
  }

  if (await isMfaBypassedForUser(authUser.id)) {
    return { enabled: false, provider: null }
  }

  try {
    const { data: factors, error } = await supabase.auth.mfa.listFactors()
    if (!error) {
      const verified = factors?.totp?.find((factor) => factor.status === 'verified')
      if (verified) {
        return { enabled: true, provider: 'supabase', factorId: verified.id }
      }
    }
  } catch {
    // Supabase MFA may be disabled on project — fall through to local storage
  }

  const local = getLocalMfa(authUser.id)
  if (local?.enabled) {
    return { enabled: true, provider: 'local' }
  }

  return { enabled: false, provider: null }
}

export async function startMfaEnrollment(email: string): Promise<{
  success: boolean
  enrollment?: MfaEnrollment
  error?: string
}> {
  const { data: authUser } = await getCurrentUser()
  if (!authUser) {
    return { success: false, error: 'You must be logged in to enable 2FA.' }
  }

  try {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Authenticator App',
    })

    if (!error && data?.totp) {
      return {
        success: true,
        enrollment: {
          provider: 'supabase',
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        },
      }
    }
  } catch {
    // Fall back to local TOTP when Supabase MFA is unavailable
  }

  const setup = createTotpSetup(email)
  return {
    success: true,
    enrollment: {
      provider: 'local',
      secret: setup.secret,
      uri: setup.uri,
    },
  }
}

export async function completeMfaEnrollment(
  enrollment: MfaEnrollment,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const { data: authUser } = await getCurrentUser()
  if (!authUser) {
    return { success: false, error: 'You must be logged in.' }
  }

  const normalizedCode = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { success: false, error: 'Enter a valid 6-digit code.' }
  }

  if (enrollment.provider === 'supabase' && enrollment.factorId) {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enrollment.factorId,
    })

    if (challengeError || !challenge) {
      return { success: false, error: challengeError?.message ?? 'Failed to start verification.' }
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.id,
      code: normalizedCode,
    })

    if (verifyError) {
      return { success: false, error: verifyError.message ?? 'Invalid verification code.' }
    }

    await syncTwoFactorMetadata(true)
    await logProfileActivity(authUser.id, '2FA Enabled', 'Security Settings')
    return { success: true }
  }

  if (!verifyTotpCode(enrollment.secret, normalizedCode)) {
    return { success: false, error: 'Invalid verification code. Try again.' }
  }

  saveLocalMfa(authUser.id, {
    enabled: true,
    secret: enrollment.secret,
    provider: 'local',
  })
  await syncTwoFactorMetadata(true)
  await logProfileActivity(authUser.id, '2FA Enabled', 'Security Settings')
  return { success: true }
}

export async function disableMfa(code: string): Promise<{ success: boolean; error?: string }> {
  const { data: authUser } = await getCurrentUser()
  if (!authUser) {
    return { success: false, error: 'You must be logged in.' }
  }

  const status = await getMfaStatus()
  if (!status.enabled) {
    return { success: false, error: '2FA is not enabled on this account.' }
  }

  const normalizedCode = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { success: false, error: 'Enter a valid 6-digit code.' }
  }

  if (status.provider === 'supabase' && status.factorId) {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: status.factorId,
    })

    if (challengeError || !challenge) {
      return { success: false, error: challengeError?.message ?? 'Failed to verify code.' }
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: status.factorId,
      challengeId: challenge.id,
      code: normalizedCode,
    })

    if (verifyError) {
      return { success: false, error: verifyError.message ?? 'Invalid verification code.' }
    }

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: status.factorId,
    })

    if (unenrollError) {
      return { success: false, error: unenrollError.message ?? 'Failed to disable 2FA.' }
    }

    await syncTwoFactorMetadata(false)
    await logProfileActivity(authUser.id, '2FA Disabled', 'Security Settings')
    return { success: true }
  }

  const local = getLocalMfa(authUser.id)
  if (!local?.secret || !verifyTotpCode(local.secret, normalizedCode)) {
    return { success: false, error: 'Invalid verification code.' }
  }

  saveLocalMfa(authUser.id, null)
  clearMfaSessionVerified(authUser.id)
  await syncTwoFactorMetadata(false)
  await logProfileActivity(authUser.id, '2FA Disabled', 'Security Settings')
  return { success: true }
}

export async function needsMfaChallenge(): Promise<{
  required: boolean
  factorId?: string
  provider?: MfaProvider
}> {
  const { data: authUser } = await getCurrentUser()
  if (authUser && (await isMfaBypassedForUser(authUser.id))) {
    return { required: false }
  }

  try {
    const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (!error && aal?.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verified = factors?.totp?.find((factor) => factor.status === 'verified')
      if (verified) {
        return { required: true, factorId: verified.id, provider: 'supabase' }
      }
    }
  } catch {
    // ignore
  }

  if (authUser) {
    const local = getLocalMfa(authUser.id)
    if (local?.enabled) {
      if (isMfaSessionVerified(authUser.id)) {
        return { required: false }
      }
      return { required: true, provider: 'local' }
    }
  }

  return { required: false }
}

export async function verifyMfaLogin(code: string): Promise<{ success: boolean; error?: string }> {
  const normalizedCode = code.replace(/\s/g, '')
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { success: false, error: 'Enter a valid 6-digit code.' }
  }

  const challenge = await needsMfaChallenge()
  if (!challenge.required) {
    return { success: true }
  }

  if (challenge.provider === 'supabase' && challenge.factorId) {
    const { data: mfaChallenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: challenge.factorId,
    })

    if (challengeError || !mfaChallenge) {
      return { success: false, error: challengeError?.message ?? 'Failed to start 2FA challenge.' }
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: challenge.factorId,
      challengeId: mfaChallenge.id,
      code: normalizedCode,
    })

    if (verifyError) {
      return { success: false, error: verifyError.message ?? 'Invalid verification code.' }
    }

    const { data: authUser } = await getCurrentUser()
    if (authUser) markMfaSessionVerified(authUser.id)
    return { success: true }
  }

  const { data: authUser } = await getCurrentUser()
  if (!authUser) {
    return { success: false, error: 'Session expired. Please sign in again.' }
  }

  const local = getLocalMfa(authUser.id)
  if (!local?.secret || !verifyTotpCode(local.secret, normalizedCode)) {
    return { success: false, error: 'Invalid verification code.' }
  }

  markMfaSessionVerified(authUser.id)
  return { success: true }
}

export function isLocalMfaEnabled(userId: string) {
  return Boolean(getLocalMfa(userId)?.enabled)
}
