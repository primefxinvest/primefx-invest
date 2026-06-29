'use client'

import { REFERRAL_COOKIE_NAME } from '@/lib/referral/constants'

const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export function persistReferralCode(code: string) {
  const normalized = code.trim()
  if (!normalized || typeof document === 'undefined') return

  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(normalized)}; path=/; max-age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

export function readReferralCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${REFERRAL_COOKIE_NAME}=`))

  if (!match) return null
  return decodeURIComponent(match.slice(REFERRAL_COOKIE_NAME.length + 1)).trim() || null
}
