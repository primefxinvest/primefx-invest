/** Rewards page sections — same route `/rewards`, views via ?tab= */

export const REWARDS_TABS = [
  { key: 'overview', label: 'Overview', href: '/rewards' },
  { key: 'achievements', label: 'Achievements', href: '/rewards?tab=achievements' },
  { key: 'milestones', label: 'Milestones', href: '/rewards?tab=milestones' },
  { key: 'rank-rewards', label: 'Rank Rewards', href: '/rewards?tab=rank-rewards' },
  { key: 'history', label: 'History', href: '/rewards?tab=history' },
] as const

export type RewardsTabKey = (typeof REWARDS_TABS)[number]['key']

const VALID = new Set<string>(REWARDS_TABS.map((t) => t.key))

export function parseRewardsTab(value: string | null | undefined): RewardsTabKey {
  if (value && VALID.has(value)) return value as RewardsTabKey
  return 'overview'
}

export function isRewardsTabActive(tab: RewardsTabKey, key: RewardsTabKey) {
  return tab === key
}
