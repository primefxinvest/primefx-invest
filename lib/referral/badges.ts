import { resolveReferralRank } from '@/lib/referral/program-config'

export type ReferralBadgeVariant =
  | 'diamond-rank'
  | 'top-referrer'
  | 'consistent-builder'
  | 'growth-expert'
  | 'network-master'
  | 'growth-machine'

export type ReferralBadgeDefinition = {
  id: ReferralBadgeVariant
  label: string
  sublabel?: string
}

export const REFERRAL_DISPLAY_BADGES: ReferralBadgeDefinition[] = [
  { id: 'diamond-rank', label: 'Diamond Rank' },
  { id: 'top-referrer', label: 'Top Referrer' },
  { id: 'consistent-builder', label: 'Consistent Builder' },
  { id: 'growth-expert', label: 'Growth Expert' },
  { id: 'network-master', label: 'Network Master' },
]

export const REFERRAL_STREAK_MILESTONES: Array<{
  months: number
  badgeId: ReferralBadgeVariant
}> = [
  { months: 3, badgeId: 'consistent-builder' },
  { months: 4, badgeId: 'growth-machine' },
  { months: 6, badgeId: 'growth-expert' },
  { months: 12, badgeId: 'network-master' },
]

export type ReferralBadgeState = ReferralBadgeDefinition & {
  unlocked: boolean
}

export type ReferralStreakState = {
  currentMonths: number
  nextMilestoneMonths: number
  currentBadge: ReferralBadgeDefinition
  nextBadge: ReferralBadgeDefinition
  currentBadgeEarned: boolean
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function computeReferralStreakMonths(referralDates: Date[]): number {
  if (referralDates.length === 0) return 0

  const activeMonths = new Set(referralDates.map(monthKey))
  const cursor = new Date()
  cursor.setDate(1)

  let streak = 0
  while (activeMonths.has(monthKey(cursor))) {
    streak += 1
    cursor.setMonth(cursor.getMonth() - 1)
  }

  return streak
}

function resolveStreakBadges(streakMonths: number): ReferralStreakState {
  const achieved = [...REFERRAL_STREAK_MILESTONES]
    .filter((row) => streakMonths >= row.months)
    .sort((a, b) => b.months - a.months)[0]

  const upcoming = [...REFERRAL_STREAK_MILESTONES]
    .filter((row) => row.months > streakMonths)
    .sort((a, b) => a.months - b.months)[0]

  const badgeById = (id: ReferralBadgeVariant): ReferralBadgeDefinition => {
    if (id === 'growth-machine') return { id, label: 'Growth Machine' }
    return REFERRAL_DISPLAY_BADGES.find((badge) => badge.id === id) ?? { id, label: id }
  }

  const currentBadge = achieved
    ? badgeById(achieved.badgeId)
    : { id: 'consistent-builder' as const, label: 'No badge yet' }

  const nextBadge = upcoming
    ? badgeById(upcoming.badgeId)
    : badgeById(REFERRAL_STREAK_MILESTONES.at(-1)!.badgeId)

  return {
    currentMonths: streakMonths,
    nextMilestoneMonths: upcoming?.months ?? REFERRAL_STREAK_MILESTONES.at(-1)!.months,
    currentBadge,
    nextBadge,
    currentBadgeEarned: Boolean(achieved),
  }
}

export function buildReferralBadgeState(input: {
  activeInvestors: number
  totalReferrals: number
  thisMonthEarnings: number
  referralDates: Date[]
}): { badges: ReferralBadgeState[]; streak: ReferralStreakState } {
  const streakMonths = computeReferralStreakMonths(input.referralDates)
  const streak = resolveStreakBadges(streakMonths)
  const rank = resolveReferralRank(input.activeInvestors)
  const now = new Date()
  const hasReferralThisMonth = input.referralDates.some((date) => monthKey(date) === monthKey(now))

  const unlockedById: Record<ReferralBadgeVariant, boolean> = {
    'diamond-rank': rank.achievedKey === 'diamond' || rank.achievedKey === 'ambassador',
    'top-referrer': hasReferralThisMonth || input.thisMonthEarnings > 0,
    'consistent-builder': streakMonths >= 3,
    'growth-expert': input.activeInvestors >= 100,
    'network-master': input.totalReferrals >= 200 || input.activeInvestors >= 500,
    'growth-machine': streakMonths >= 4,
  }

  const badges: ReferralBadgeState[] = REFERRAL_DISPLAY_BADGES.map((badge) => ({
    ...badge,
    sublabel: badge.id === 'top-referrer' ? formatMonthYear(now) : badge.sublabel,
    unlocked: unlockedById[badge.id],
  }))

  return { badges, streak }
}
