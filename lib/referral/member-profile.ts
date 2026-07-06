/** Shared referral member display helpers (safe for client + server). */

export type ReferralMemberProfileRow = {
  id: string
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  referral_code?: string | null
  country?: string | null
  kyc_status?: string | null
  is_verified?: boolean | null
  verification_status?: string | null
  investor_tier?: string | null
}

export function isReferralMemberVerified(profile: {
  kyc_status?: string | null
  is_verified?: boolean | null
  verification_status?: string | null
}): boolean {
  return (
    Boolean(profile.is_verified) ||
    String(profile.kyc_status ?? '').toLowerCase() === 'verified' ||
    String(profile.verification_status ?? '').toLowerCase() === 'approved'
  )
}

/** Never expose database IDs as display names. */
export function resolveReferralDisplayName(input: {
  fullName?: string | null
  email?: string | null
}): string {
  const fullName = input.fullName?.trim()
  if (fullName) return fullName

  const email = input.email?.trim()
  if (email?.includes('@')) {
    const local = email.split('@')[0]?.trim()
    if (local) {
      return local.charAt(0).toUpperCase() + local.slice(1)
    }
  }

  return 'Anonymous Investor'
}

export function resolveReferralInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function resolveReferralUsername(profile: {
  referral_code?: string | null
  email?: string | null
}): string | null {
  const code = profile.referral_code?.trim()
  if (code) return code

  const email = profile.email?.trim()
  if (email?.includes('@')) {
    return email.split('@')[0] ?? null
  }

  return null
}
