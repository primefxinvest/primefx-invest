import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'

const BATCH_SIZE = 150

export type MemberInvestmentMetrics = {
  activeVolumeUsd: number
  totalVolumeUsd: number
  primaryPlan: string | null
  hasActiveInvestment: boolean
  profitUsd: number
}

export type NetworkMetricsResult = {
  teamVolumeUsd: number
  teamProfitUsd: number
  activeInvestorCount: number
  memberMetrics: Map<string, MemberInvestmentMetrics>
  volumeTrend: string
  profitTrend: string
  pendingCommissionUsd: number
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

function formatTrend(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '+0%'
  const pct = ((current - previous) / previous) * 100
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`
}

function emptyMemberMetrics(): MemberInvestmentMetrics {
  return {
    activeVolumeUsd: 0,
    totalVolumeUsd: 0,
    primaryPlan: null,
    hasActiveInvestment: false,
    profitUsd: 0,
  }
}

const PROFIT_TRANSACTION_TYPES = ['profit', 'investment_profit'] as const

export function isActiveInvestmentStatus(status: unknown): boolean {
  return String(status ?? '').toLowerCase() === 'active'
}

export function isActiveReferralStatus(status: unknown): boolean {
  return String(status ?? '').toLowerCase() === 'active'
}

/** Active investor = active investment position (matches rank + commission rules). */
export function isActiveNetworkInvestor(input: {
  hasActiveInvestment?: boolean
}): boolean {
  return Boolean(input.hasActiveInvestment)
}

async function syncReferralActiveStatuses(admin: SupabaseClient, memberIds: string[]) {
  if (!memberIds.length) return

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data: investments } = await admin
      .from('investments')
      .select('user_id, status')
      .in('user_id', batch)

    const activeIds = [
      ...new Set(
        (investments ?? [])
          .filter((row) => isActiveInvestmentStatus(row.status))
          .map((row) => row.user_id as string)
      ),
    ]
    if (!activeIds.length) continue

    await admin
      .from('referrals')
      .update({ status: 'Active' })
      .in('referred_user_id', activeIds)
      .neq('status', 'Active')
  }
}

async function fetchInvestmentMetrics(
  admin: SupabaseClient,
  memberIds: string[]
): Promise<Map<string, MemberInvestmentMetrics>> {
  const metrics = new Map<string, MemberInvestmentMetrics>()
  memberIds.forEach((id) => metrics.set(id, emptyMemberMetrics()))

  if (!memberIds.length) return metrics

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data: investments, error } = await admin
      .from('investments')
      .select('user_id, amount, current_value, status, plan_id')
      .in('user_id', batch)

    if (error) continue

    const planNames = new Map<string, string>()
    const planIds = [
      ...new Set(
        (investments ?? [])
          .map((row) => row.plan_id as string | null)
          .filter(Boolean) as string[]
      ),
    ]

    if (planIds.length > 0) {
      const { data: plans } = await admin
        .from('investment_plans')
        .select('id, name')
        .in('id', planIds)

      plans?.forEach((plan) => {
        planNames.set(plan.id as string, String(plan.name ?? ''))
      })
    }

    for (const row of investments ?? []) {
      const userId = row.user_id as string
      const current = metrics.get(userId) ?? emptyMemberMetrics()
      const amount = Number(row.amount ?? 0)
      const planName = planNames.get(String(row.plan_id ?? '')) || null

      current.totalVolumeUsd += amount
      if (isActiveInvestmentStatus(row.status)) {
        current.activeVolumeUsd += Number(row.current_value ?? amount)
        current.hasActiveInvestment = true
        if (!current.primaryPlan && planName) {
          current.primaryPlan = planName
        }
      }

      metrics.set(userId, current)
    }
  }

  return metrics
}

async function fetchProfitByMember(
  admin: SupabaseClient,
  memberIds: string[]
): Promise<Map<string, number>> {
  const profits = new Map<string, number>()
  if (!memberIds.length) return profits

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data: rows } = await admin
      .from('transactions')
      .select('user_id, amount')
      .in('user_id', batch)
      .in('type', [...PROFIT_TRANSACTION_TYPES])
      .ilike('status', 'completed')

    for (const row of rows ?? []) {
      const userId = row.user_id as string
      profits.set(userId, (profits.get(userId) ?? 0) + Number(row.amount ?? 0))
    }
  }

  return profits
}

async function fetchVolumeTrend(
  admin: SupabaseClient,
  memberIds: string[]
): Promise<string> {
  if (!memberIds.length) return '+0%'

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let currentMonth = 0
  let priorMonth = 0

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data: rows } = await admin
      .from('investments')
      .select('amount, created_at')
      .in('user_id', batch)

    for (const row of rows ?? []) {
      const amount = Number(row.amount ?? 0)
      const created = new Date(row.created_at as string)
      if (created >= monthStart) currentMonth += amount
      else if (created >= prevMonthStart && created < monthStart) priorMonth += amount
    }
  }

  return formatTrend(currentMonth, priorMonth)
}

async function fetchProfitTrend(
  admin: SupabaseClient,
  memberIds: string[]
): Promise<string> {
  if (!memberIds.length) return '+0%'

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let currentMonth = 0
  let priorMonth = 0

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data: rows } = await admin
      .from('transactions')
      .select('amount, created_at')
      .in('user_id', batch)
      .in('type', [...PROFIT_TRANSACTION_TYPES])
      .ilike('status', 'completed')

    for (const row of rows ?? []) {
      const amount = Number(row.amount ?? 0)
      const created = new Date(row.created_at as string)
      if (created >= monthStart) currentMonth += amount
      else if (created >= prevMonthStart && created < monthStart) priorMonth += amount
    }
  }

  return formatTrend(currentMonth, priorMonth)
}

export async function fetchPendingCommissionUsd(referrerId: string): Promise<number> {
  const admin = createAdminSupabaseClient()
  if (!admin) return 0

  const { data } = await admin
    .from('referral_commissions')
    .select('commission_usd')
    .eq('referrer_id', referrerId)
    .eq('status', 'pending')

  return (data ?? []).reduce((sum, row) => sum + Number(row.commission_usd ?? 0), 0)
}

export async function fetchCommissionsBySource(
  referrerId: string,
  sourceUserIds: string[]
): Promise<Map<string, { total: number; thisMonth: number; priorMonth: number }>> {
  const admin = createAdminSupabaseClient()
  const result = new Map<string, { total: number; thisMonth: number; priorMonth: number }>()
  if (!admin || !sourceUserIds.length) return result

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  for (const batch of chunk(sourceUserIds, BATCH_SIZE)) {
    const { data } = await admin
      .from('referral_commissions')
      .select('source_user_id, commission_usd, created_at')
      .eq('referrer_id', referrerId)
      .in('source_user_id', batch)

    for (const row of data ?? []) {
      const sourceId = row.source_user_id as string
      const amount = Number(row.commission_usd ?? 0)
      const created = new Date(row.created_at as string)
      const current = result.get(sourceId) ?? { total: 0, thisMonth: 0, priorMonth: 0 }
      current.total += amount
      if (created >= monthStart) current.thisMonth += amount
      else if (created >= prevMonthStart && created < monthStart) current.priorMonth += amount
      result.set(sourceId, current)
    }
  }

  return result
}

export async function fetchMemberRankNames(
  memberIds: string[]
): Promise<Map<string, string>> {
  const admin = createAdminSupabaseClient()
  const ranks = new Map<string, string>()
  if (!admin || !memberIds.length) return ranks

  const { REFERRAL_RANK_TIERS, REFERRAL_UNRANKED } = await import('@/lib/referral/program-config')

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    const { data } = await admin
      .from('user_referral_stats')
      .select('user_id, rank_key, active_member_count')
      .in('user_id', batch)

    for (const row of data ?? []) {
      const rankKey = row.rank_key as string | null
      if (rankKey) {
        const tier = REFERRAL_RANK_TIERS.find((item) => item.key === rankKey)
        ranks.set(row.user_id as string, tier?.name ?? REFERRAL_UNRANKED.name)
      } else {
        ranks.set(row.user_id as string, REFERRAL_UNRANKED.name)
      }
    }
  }

  return ranks
}

export async function fetchReferralStatuses(
  memberIds: string[],
  referrerId?: string
): Promise<Map<string, string>> {
  const admin = createAdminSupabaseClient()
  const statuses = new Map<string, string>()
  if (!admin || !memberIds.length) return statuses

  for (const batch of chunk(memberIds, BATCH_SIZE)) {
    let query = admin
      .from('referrals')
      .select('referred_user_id, status')
      .in('referred_user_id', batch)

    if (referrerId) {
      query = query.eq('referrer_id', referrerId)
    }

    const { data } = await query

    for (const row of data ?? []) {
      statuses.set(row.referred_user_id as string, String(row.status ?? 'Pending'))
    }
  }

  return statuses
}

export async function fetchNetworkMetrics(
  memberIds: string[],
  options: { syncStatuses?: boolean } = {}
): Promise<NetworkMetricsResult> {
  const admin = createAdminSupabaseClient()
  if (!admin || !memberIds.length) {
    return {
      teamVolumeUsd: 0,
      teamProfitUsd: 0,
      activeInvestorCount: 0,
      memberMetrics: new Map(),
      volumeTrend: '+0%',
      profitTrend: '+0%',
      pendingCommissionUsd: 0,
    }
  }

  if (options.syncStatuses !== false) {
    await syncReferralActiveStatuses(admin, memberIds)
  }

  const [memberMetrics, profitByMember, volumeTrend, profitTrend] = await Promise.all([
    fetchInvestmentMetrics(admin, memberIds),
    fetchProfitByMember(admin, memberIds),
    fetchVolumeTrend(admin, memberIds),
    fetchProfitTrend(admin, memberIds),
  ])

  let teamVolumeUsd = 0
  let teamProfitUsd = 0
  let activeInvestorCount = 0

  for (const memberId of memberIds) {
    const metrics = memberMetrics.get(memberId) ?? emptyMemberMetrics()
    const profitUsd = profitByMember.get(memberId) ?? 0
    metrics.profitUsd = profitUsd
    memberMetrics.set(memberId, metrics)

    teamVolumeUsd += metrics.activeVolumeUsd
    teamProfitUsd += profitUsd
    if (metrics.hasActiveInvestment) {
      activeInvestorCount += 1
    }
  }

  return {
    teamVolumeUsd: Math.round(teamVolumeUsd * 100) / 100,
    teamProfitUsd: Math.round(teamProfitUsd * 100) / 100,
    activeInvestorCount,
    memberMetrics,
    volumeTrend,
    profitTrend,
    pendingCommissionUsd: 0,
  }
}

export async function countActiveNetworkInvestors(memberIds: string[]): Promise<number> {
  const metrics = await fetchNetworkMetrics(memberIds, { syncStatuses: true })
  return metrics.activeInvestorCount
}
