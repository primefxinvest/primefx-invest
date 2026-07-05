/** Referral & Earn in-app sections — same route `/referral`, different views via ?section= */

export const REFERRAL_SECTIONS = [
  { key: 'overview', label: 'Overview', href: '/referral' },
  { key: 'rank', label: 'My Rank', href: '/referral?section=rank' },
  { key: 'network', label: 'My Network', href: '/referral?section=network' },
  { key: 'benefits', label: 'Rank Benefits', href: '/referral?section=benefits' },
  { key: 'leaderboard', label: 'Leaderboard', href: '/referral?section=leaderboard' },
  { key: 'payouts', label: 'Payouts', href: '/referral?section=payouts' },
] as const

export type ReferralSectionKey = (typeof REFERRAL_SECTIONS)[number]['key']

const VALID_KEYS = new Set<string>(REFERRAL_SECTIONS.map((row) => row.key))

export function parseReferralSection(value: string | null | undefined): ReferralSectionKey {
  if (value && VALID_KEYS.has(value)) {
    return value as ReferralSectionKey
  }
  return 'overview'
}

export function isReferralRoute(pathname: string) {
  return pathname === '/referral' || pathname.startsWith('/referral/')
}

export function isReferralSectionActive(section: ReferralSectionKey, key: ReferralSectionKey) {
  return section === key
}

export function referralSectionHref(key: ReferralSectionKey) {
  return REFERRAL_SECTIONS.find((row) => row.key === key)?.href ?? '/referral'
}
