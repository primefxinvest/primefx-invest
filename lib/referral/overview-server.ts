import 'server-only'

import { formatCurrency, formatDate, toNumber } from '@/lib/data/format'
import type { ReferralData } from '@/lib/data/types'
import { buildReferralProgramOverview } from '@/lib/referral/analytics'
import type { ReferralListItem } from '@/lib/referral/analytics'
import { REFERRAL_PROFIT_SHARE_LEVELS, formatReferralRate, REFERRAL_UNRANKED } from '@/lib/referral/program-config'
import { buildDailyEarningsTimeline } from '@/lib/referral/earnings-chart'
import { getReferralNetworkDescendants, refreshUserReferralStats } from '@/lib/referral/network'
import { buildReferralLink } from '@/lib/referral/share'
import { getSiteUrl } from '@/lib/seo/site'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  isReferralMemberVerified,
  resolveReferralDisplayName,
  resolveReferralUsername,
} from '@/lib/referral/member-profile'
import { fetchReferralMemberProfiles } from '@/lib/referral/member-profiles-server'
import {
  fetchCommissionsBySource,
  fetchMemberRankNames,
  fetchNetworkMetrics,
  fetchPendingCommissionUsd,
  fetchReferralStatuses,
  isActiveReferralStatus,
} from '@/lib/referral/team-metrics'

export type ReferralProgramPageData = {
  referralData: ReferralData
  referrals: ReferralListItem[]
  overview: ReturnType<typeof buildReferralProgramOverview>
}

async function fetchCommissionTimeline(referrerId: string) {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return {
      thisWeekEarnings: 0,
      thisMonthEarnings: 0,
      earningsTimeline: [],
      periodTrends: { week: '+0%', month: '+0%', lifetime: '+0%' },
    }
  }

  const { data } = await admin
    .from('referral_commissions')
    .select('commission_usd, created_at, status')
    .eq('referrer_id', referrerId)
    .eq('status', 'paid')

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  const prevWeekStart = new Date(weekStart)
  prevWeekStart.setDate(prevWeekStart.getDate() - 7)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  let thisWeekEarnings = 0
  let thisMonthEarnings = 0
  let priorWeekEarnings = 0
  let priorMonthEarnings = 0
  let lifetimeBeforeMonth = 0

  for (const row of data ?? []) {
    const amount = Number(row.commission_usd ?? 0)
    const created = new Date(row.created_at as string)

    if (created >= weekStart) thisWeekEarnings += amount
    else if (created >= prevWeekStart && created < weekStart) priorWeekEarnings += amount

    if (created >= monthStart) thisMonthEarnings += amount
    else if (created >= prevMonthStart && created <= prevMonthEnd) priorMonthEarnings += amount
    else if (created < monthStart) lifetimeBeforeMonth += amount
  }

  const earningsTimeline = buildDailyEarningsTimeline(data ?? [], 365)

  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '+0%'
    const pct = ((current - previous) / previous) * 100
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
  }

  return {
    thisWeekEarnings: Math.round(thisWeekEarnings * 100) / 100,
    thisMonthEarnings: Math.round(thisMonthEarnings * 100) / 100,
    earningsTimeline,
    periodTrends: {
      week: formatTrend(thisWeekEarnings, priorWeekEarnings),
      month: formatTrend(thisMonthEarnings, priorMonthEarnings),
      lifetime: formatTrend(thisMonthEarnings + lifetimeBeforeMonth, lifetimeBeforeMonth),
    },
  }
}

async function fetchLevelEarnings(referrerId: string) {
  const admin = createAdminSupabaseClient()
  if (!admin) {
    return REFERRAL_PROFIT_SHARE_LEVELS.map((level) => ({
      level: level.level,
      earnings: 0,
    }))
  }

  const { data } = await admin
    .from('referral_commissions')
    .select('level, commission_usd, status')
    .eq('referrer_id', referrerId)
    .in('commission_type', ['profit_share'])

  const totals = new Map<number, number>()
  for (const row of data ?? []) {
    const level = Number(row.level)
    totals.set(level, (totals.get(level) ?? 0) + Number(row.commission_usd ?? 0))
  }

  return REFERRAL_PROFIT_SHARE_LEVELS.map((level) => ({
    level: level.level,
    earnings: totals.get(level.level) ?? 0,
  }))
}

export async function fetchReferralProgramOverviewServer(
  userId: string
): Promise<ReferralProgramPageData> {
  const supabase = await createServerSupabaseClient()
  const admin = createAdminSupabaseClient()

  const [{ data: user }, { data: initialReferrals }] = await Promise.all([
    supabase.from('users').select('referral_code').eq('id', userId).maybeSingle(),
    supabase
      .from('referrals')
      .select('id, referred_user_id, bonus_earned, status, created_at')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false }),
  ])

  let referralRows = initialReferrals ?? []

  let totalCommissionEarnings = 0
  if (admin) {
    const { data: commissionRows } = await admin
      .from('referral_commissions')
      .select('commission_usd')
      .eq('referrer_id', userId)
      .eq('status', 'paid')

    totalCommissionEarnings = (commissionRows ?? []).reduce(
      (sum, row) => sum + Number(row.commission_usd ?? 0),
      0
    )
  }

  const totalEarnings = totalCommissionEarnings

  const referralCode = (user?.referral_code as string | undefined)?.trim() || userId.slice(0, 8)
  const origin = getSiteUrl()

  const referralData: ReferralData = {
    referralLink: buildReferralLink(origin, referralCode),
    referralCode,
    totalReferrals: referralRows.length,
    totalEarnings: formatCurrency(totalEarnings),
  }

  const referredIds = referralRows
    .map((row) => row.referred_user_id as string)
    .filter(Boolean)

  let networkDescendants = await getReferralNetworkDescendants(userId)

  if (referredIds.length > 0 && networkDescendants.length === 0) {
    const { buildReferralNetworkForUser } = await import('@/lib/referral/network')
    await Promise.all(
      referralRows.map((row) =>
        buildReferralNetworkForUser(row.referred_user_id as string, userId)
      )
    )
    networkDescendants = await getReferralNetworkDescendants(userId)
  }

  const allMemberIds = [
    ...new Set([
      ...referredIds,
      ...networkDescendants.map((row) => row.descendantId),
    ]),
  ]

  const referredUsers = await fetchReferralMemberProfiles(allMemberIds)

  // Sync investment-backed referral statuses before reading metrics and statuses.
  const networkMetrics = await fetchNetworkMetrics(allMemberIds)

  const { data: refreshedReferrals } = await supabase
    .from('referrals')
    .select('id, referred_user_id, bonus_earned, status, created_at')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  referralRows = refreshedReferrals ?? referralRows

  const [referralStatuses, memberRankNames, commissionsBySource, pendingCommissionUsd] =
    await Promise.all([
      fetchReferralStatuses(allMemberIds),
      fetchMemberRankNames(allMemberIds),
      fetchCommissionsBySource(userId, allMemberIds),
      fetchPendingCommissionUsd(userId),
    ])

  await refreshUserReferralStats(userId)

  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : null
    const pct = ((current - previous) / previous) * 100
    return `${pct >= 0 ? '+' : ''}${Math.round(pct)}%`
  }

  const resolveMemberStatus = (
    metrics: ReturnType<typeof networkMetrics.memberMetrics.get>,
    directStatus?: string | null,
    networkStatus?: string | null
  ): string => {
    if (metrics?.hasActiveInvestment || isActiveReferralStatus(directStatus)) {
      return 'Active'
    }
    if (isActiveReferralStatus(networkStatus)) return 'Active'
    return directStatus ?? networkStatus ?? 'Pending'
  }

  const buildReferralListItem = (
    memberId: string,
    directRow: (typeof referralRows)[number] | undefined,
    depth: number
  ): ReferralListItem => {
    const profile = referredUsers.get(memberId)
    const metrics = networkMetrics.memberMetrics.get(memberId)
    const commission = commissionsBySource.get(memberId)
    const status = resolveMemberStatus(
      metrics,
      directRow?.status as string | undefined,
      referralStatuses.get(memberId)
    )

    const commissionEarned = commission?.total ?? (directRow ? toNumber(directRow.bonus_earned) : 0)
    const teamVolumeUsd = metrics?.activeVolumeUsd ?? 0

    return {
      id: directRow?.id ?? `${memberId}-${depth}`,
      userId: memberId,
      name: resolveReferralDisplayName({
        fullName: profile?.full_name,
        email: profile?.email,
      }),
      email: profile?.email?.trim() || 'Network member',
      username: profile ? resolveReferralUsername(profile) : null,
      avatarUrl: profile?.avatar_url ?? null,
      country: profile?.country ?? null,
      verified: profile ? isReferralMemberVerified(profile) : false,
      status,
      commissionEarned,
      joinedDate: directRow ? formatDate(directRow.created_at as string) : '—',
      tradingVolume: formatCurrency(teamVolumeUsd),
      teamVolumeUsd,
      investmentPlan: metrics?.primaryPlan ?? profile?.investor_tier ?? null,
      rankName: memberRankNames.get(memberId) ?? REFERRAL_UNRANKED.name,
      trendPercent: formatTrend(commission?.thisMonth ?? 0, commission?.priorMonth ?? 0),
      networkLevel: depth,
    }
  }

  const directReferralByUserId = new Map(
    referralRows.map((row) => [row.referred_user_id as string, row])
  )

  const referralList: ReferralListItem[] =
    networkDescendants.length > 0
      ? networkDescendants.map((member) =>
          buildReferralListItem(
            member.descendantId,
            directReferralByUserId.get(member.descendantId),
            member.depth
          )
        )
      : referralRows.map((row) =>
          buildReferralListItem(row.referred_user_id as string, row, 1)
        )

  const levelEarnings = await fetchLevelEarnings(userId)
  const commissionTimeline = await fetchCommissionTimeline(userId)

  const { data: stats } = admin
    ? await admin
        .from('user_referral_stats')
        .select('active_member_count, total_member_count, rank_key')
        .eq('user_id', userId)
        .maybeSingle()
    : { data: null }

  const referralDates = referralRows
    .map((row) => new Date(row.created_at as string))
    .filter((date) => !Number.isNaN(date.getTime()))

  const activeInvestorsFromList = referralList.filter((row) => row.status === 'Active').length
  const activeInvestors = Math.max(networkMetrics.activeInvestorCount, activeInvestorsFromList)

  return {
    referralData,
    referrals: referralList,
    overview: buildReferralProgramOverview(referralList, referralData.totalReferrals, {
      lifetimeEarningsOverride: totalEarnings,
      levelEarnings,
      memberCount: Number(stats?.total_member_count ?? referralRows.length),
      activeInvestors,
      teamVolumeUsd: networkMetrics.teamVolumeUsd,
      teamProfitUsd: networkMetrics.teamProfitUsd,
      teamVolumeTrend: networkMetrics.volumeTrend,
      teamProfitTrend: networkMetrics.profitTrend,
      pendingCommissionUsd,
      thisWeekEarnings: commissionTimeline.thisWeekEarnings,
      thisMonthEarnings: commissionTimeline.thisMonthEarnings,
      earningsTimeline: commissionTimeline.earningsTimeline,
      periodTrends: commissionTimeline.periodTrends,
      referralDates,
    }),
  }
}
