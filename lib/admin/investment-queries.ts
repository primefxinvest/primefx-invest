import 'server-only'

import { calculateDailyProfit } from '@/lib/invest/profit-engine'
import { createAdminSupabaseClient } from '@/lib/supabase/admin-server'
import type {
  AdminDisplayRank,
  AdminInvestmentActivityRow,
  AdminInvestmentAnalytics,
  AdminInvestmentDetail,
  AdminInvestmentRow,
  AdminInvestmentStats,
} from './investment-types'

function getDb() {
  const db = createAdminSupabaseClient()
  if (!db) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin investment queries.')
  }
  return db
}

function mapInvestmentRow(row: Record<string, unknown>): AdminInvestmentRow {
  const user = row.users as Record<string, unknown> | null
  const plan = row.investment_plans as Record<string, unknown> | null
  const rank = user?.admin_display_ranks as Record<string, unknown> | null
  const amount = Number(row.amount ?? 0)
  const current = Number(row.current_value ?? amount)

  return {
    id: String(row.id),
    reference_id: (row.reference_id as string | null) ?? null,
    user_id: String(row.user_id),
    user_email: String(user?.email ?? ''),
    user_name: (user?.full_name as string | null) ?? null,
    user_avatar: (user?.avatar_url as string | null) ?? null,
    user_country: (user?.country as string | null) ?? null,
    investor_tier: (user?.investor_tier as string | null) ?? null,
    display_rank_name: (rank?.name as string | null) ?? null,
    display_rank_color: (rank?.color as string | null) ?? null,
    plan_name: String(plan?.name ?? 'Unknown Plan'),
    amount,
    current_value: current,
    accumulated_profit: Number(row.accumulated_profit ?? Math.max(0, current - amount)),
    daily_profit: Number(row.daily_profit ?? 0),
    roi_percentage: Number(row.roi_percentage ?? 0),
    status: String(row.status ?? 'Active'),
    start_date: String(row.start_date ?? row.created_at),
    created_at: String(row.created_at),
    next_payout_at: (row.next_payout_at as string | null) ?? null,
    capital_withdrawal_unlock_at: (row.capital_withdrawal_unlock_at as string | null) ?? null,
    compound_mode: Boolean(row.compound_mode ?? false),
  }
}

const INVESTMENT_SELECT = `
  *,
  users (
    id,
    email,
    full_name,
    avatar_url,
    country,
    investor_tier,
    admin_display_rank_id,
    admin_display_ranks (name, color)
  ),
  investment_plans (name, weekly_roi)
`

export async function getAdminInvestments(): Promise<AdminInvestmentRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('investments')
    .select(INVESTMENT_SELECT)
    .order('created_at', { ascending: false })
    .limit(1000)

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapInvestmentRow(row as Record<string, unknown>))
}

export async function getAdminInvestmentById(
  investmentId: string
): Promise<AdminInvestmentDetail | null> {
  const db = getDb()

  const { data: row, error } = await db
    .from('investments')
    .select(INVESTMENT_SELECT)
    .eq('id', investmentId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!row) return null

  const investment = mapInvestmentRow(row as Record<string, unknown>)
  const userId = investment.user_id

  const [
    userRes,
    walletRes,
    profitRes,
    txRes,
    withdrawalRes,
    commissionRes,
  ] = await Promise.all([
    db
      .from('users')
      .select(
        'id, email, full_name, avatar_url, country, phone_number, kyc_status, account_status, investor_tier, created_at, admin_display_ranks(name)'
      )
      .eq('id', userId)
      .maybeSingle(),
    db.from('wallet_balances').select('*').eq('user_id', userId).maybeSingle(),
    db
      .from('investment_profit_history')
      .select('id, period_date, amount_usd, daily_rate, principal_usd, created_at')
      .eq('investment_id', investmentId)
      .order('period_date', { ascending: false })
      .limit(100),
    db
      .from('transactions')
      .select('id, type, amount, status, description, created_at')
      .eq('investment_id', investmentId)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('investment_withdrawal_requests')
      .select('id, amount_usd, status, requested_at, available_at')
      .eq('investment_id', investmentId)
      .order('requested_at', { ascending: false })
      .limit(50),
    db
      .from('referral_commissions')
      .select('id, commission_usd, level, status, period_start, period_end, created_at')
      .eq('source_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const userRow = userRes.data as Record<string, unknown> | null
  const rank = userRow?.admin_display_ranks as Record<string, unknown> | null

  const profitHistory = (profitRes.data ?? []).map((p) => ({
    id: String(p.id),
    period_date: String(p.period_date),
    amount_usd: Number(p.amount_usd ?? 0),
    daily_rate: Number(p.daily_rate ?? 0),
    principal_usd: Number(p.principal_usd ?? 0),
    created_at: String(p.created_at),
  }))

  const transactions = (txRes.data ?? []).map((t) => ({
    id: String(t.id),
    type: String(t.type),
    amount: Number(t.amount ?? 0),
    status: String(t.status),
    description: (t.description as string | null) ?? null,
    created_at: String(t.created_at),
  }))

  const withdrawalHistory = (withdrawalRes.data ?? []).map((w) => ({
    id: String(w.id),
    amount_usd: Number(w.amount_usd ?? 0),
    status: String(w.status),
    requested_at: String(w.requested_at),
    available_at: (w.available_at as string | null) ?? null,
  }))

  const referralCommissions = (commissionRes.data ?? []).map((c) => ({
    id: String(c.id),
    commission_usd: Number(c.commission_usd ?? 0),
    level: Number(c.level ?? 0),
    status: String(c.status),
    period_start: String(c.period_start),
    period_end: String(c.period_end),
    created_at: String(c.created_at),
  }))

  const timeline = [
    {
      id: `inv-${investment.id}`,
      label: 'Investment created',
      detail: `${investment.plan_name} · ${investment.amount}`,
      at: investment.created_at,
      kind: 'investment' as const,
    },
    ...profitHistory.slice(0, 20).map((p) => ({
      id: `profit-${p.id}`,
      label: 'Daily profit credited',
      detail: `$${p.amount_usd.toFixed(2)}`,
      at: p.created_at,
      kind: 'profit' as const,
    })),
    ...withdrawalHistory.map((w) => ({
      id: `wd-${w.id}`,
      label: 'Capital withdrawal request',
      detail: `$${w.amount_usd.toFixed(2)} · ${w.status}`,
      at: w.requested_at,
      kind: 'withdrawal' as const,
    })),
    ...transactions.map((t) => ({
      id: `tx-${t.id}`,
      label: t.type,
      detail: `$${t.amount.toFixed(2)} · ${t.status}`,
      at: t.created_at,
      kind: 'transaction' as const,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const walletRow = walletRes.data

  return {
    investment,
    user: {
      id: userId,
      email: String(userRow?.email ?? investment.user_email),
      full_name: (userRow?.full_name as string | null) ?? investment.user_name,
      avatar_url: (userRow?.avatar_url as string | null) ?? investment.user_avatar,
      country: (userRow?.country as string | null) ?? investment.user_country,
      phone_number: (userRow?.phone_number as string | null) ?? null,
      kyc_status: (userRow?.kyc_status as string | null) ?? null,
      account_status: (userRow?.account_status as string | null) ?? null,
      investor_tier: (userRow?.investor_tier as string | null) ?? investment.investor_tier,
      display_rank_name: (rank?.name as string | null) ?? investment.display_rank_name,
      created_at: String(userRow?.created_at ?? ''),
    },
    wallet: walletRow
      ? {
          available_balance: Number(walletRow.available_balance ?? 0),
          total_balance: Number(walletRow.total_balance ?? 0),
          pending_balance: Number(walletRow.pending_balance ?? 0),
          bonus_balance: Number(walletRow.bonus_balance ?? 0),
        }
      : null,
    profitHistory,
    transactions,
    withdrawalHistory,
    referralCommissions,
    timeline,
  }
}

export async function getAdminInvestmentStats(
  investments: AdminInvestmentRow[]
): Promise<AdminInvestmentStats> {
  const active = investments.filter((i) => i.status.toLowerCase() === 'active')
  const totalInvestedCapital = active.reduce((sum, i) => sum + i.amount, 0)
  const totalOutstandingProfit = active.reduce((sum, i) => sum + i.accumulated_profit, 0)
  const todayProfit = active.reduce((sum, i) => sum + i.daily_profit, 0)
  const weeklyProfit = todayProfit * 7
  const monthlyProfit = todayProfit * 30
  const averageRoi =
    active.length > 0
      ? active.reduce((sum, i) => {
          const roi = i.amount > 0 ? ((i.current_value - i.amount) / i.amount) * 100 : 0
          return sum + roi
        }, 0) / active.length
      : 0

  const byAmount = [...active].sort((a, b) => b.amount - a.amount)[0]
  const byNewest = [...investments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]

  return {
    totalActive: active.length,
    totalInvestedCapital,
    totalOutstandingProfit,
    todayProfit,
    weeklyProfit,
    monthlyProfit,
    averageRoi: Math.round(averageRoi * 100) / 100,
    highestInvestor: byAmount
      ? {
          name: byAmount.user_name ?? byAmount.user_email,
          email: byAmount.user_email,
          amount: byAmount.amount,
        }
      : null,
    newestInvestor: byNewest
      ? {
          name: byNewest.user_name ?? byNewest.user_email,
          email: byNewest.user_email,
          createdAt: byNewest.created_at,
        }
      : null,
  }
}

export async function getAdminInvestmentAnalytics(
  investments: AdminInvestmentRow[]
): Promise<AdminInvestmentAnalytics> {
  const growthMap = new Map<string, { amount: number; count: number }>()
  const planMap = new Map<string, { value: number; amount: number }>()
  const countryMap = new Map<string, number>()
  const rankMap = new Map<string, number>()
  const dailyMap = new Map<string, { count: number; amount: number }>()
  const profitBuckets = { low: 0, mid: 0, high: 0, elite: 0 }

  for (const inv of investments) {
    const month = inv.created_at.slice(0, 7)
    const g = growthMap.get(month) ?? { amount: 0, count: 0 }
    g.amount += inv.amount
    g.count += 1
    growthMap.set(month, g)

    const plan = planMap.get(inv.plan_name) ?? { value: 0, amount: 0 }
    plan.value += 1
    plan.amount += inv.amount
    planMap.set(inv.plan_name, plan)

    const country = inv.user_country ?? 'Unknown'
    countryMap.set(country, (countryMap.get(country) ?? 0) + 1)

    const rank = inv.display_rank_name ?? inv.investor_tier ?? 'Unassigned'
    rankMap.set(rank, (rankMap.get(rank) ?? 0) + 1)

    const day = inv.created_at.slice(0, 10)
    const d = dailyMap.get(day) ?? { count: 0, amount: 0 }
    d.count += 1
    d.amount += inv.amount
    dailyMap.set(day, d)

    const profit = inv.accumulated_profit
    if (profit < 100) profitBuckets.low += 1
    else if (profit < 1000) profitBuckets.mid += 1
    else if (profit < 10000) profitBuckets.high += 1
    else profitBuckets.elite += 1
  }

  return {
    investmentGrowth: Array.from(growthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, v]) => ({ month, ...v })),
    planDistribution: Array.from(planMap.entries()).map(([name, v]) => ({ name, ...v })),
    profitDistribution: [
      { range: '$0 – $99', count: profitBuckets.low },
      { range: '$100 – $999', count: profitBuckets.mid },
      { range: '$1K – $9.9K', count: profitBuckets.high },
      { range: '$10K+', count: profitBuckets.elite },
    ],
    countryDistribution: Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    rankDistribution: Array.from(rankMap.entries())
      .map(([rank, count]) => ({ rank, count }))
      .sort((a, b) => b.count - a.count),
    dailyInvestments: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, v]) => ({ date, ...v })),
  }
}

export async function getAdminDisplayRanks(): Promise<AdminDisplayRank[]> {
  const db = getDb()
  const { data, error } = await db
    .from('admin_display_ranks')
    .select('*')
    .order('priority', { ascending: false })

  if (error) {
    if (error.message.includes('admin_display_ranks')) return []
    throw new Error(error.message)
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    badge: (row.badge as string | null) ?? null,
    color: String(row.color ?? '#0052ff'),
    icon: String(row.icon ?? 'Award'),
    description: (row.description as string | null) ?? null,
    priority: Number(row.priority ?? 0),
    benefits: Array.isArray(row.benefits) ? (row.benefits as string[]) : [],
    admin_notes: (row.admin_notes as string | null) ?? null,
    status: String(row.status ?? 'active'),
    is_custom: Boolean(row.is_custom),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  }))
}

export async function getAdminInvestmentActivity(limit = 50): Promise<AdminInvestmentActivityRow[]> {
  const db = getDb()
  const { data, error } = await db
    .from('admin_audit_logs')
    .select('id, admin_id, action, target_user_id, target_resource, metadata, created_at')
    .eq('module', 'investment_management')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)

  const adminIds = [...new Set((data ?? []).map((r) => r.admin_id as string))]
  const { data: admins } =
    adminIds.length > 0
      ? await db.from('users').select('id, email').in('id', adminIds)
      : { data: [] as Record<string, unknown>[] }

  const emailMap = new Map(
    (admins ?? []).map((a) => [String(a.id), String(a.email)])
  )

  return (data ?? []).map((row) => ({
    id: String(row.id),
    admin_email: emailMap.get(String(row.admin_id)) ?? null,
    action: String(row.action),
    target_user_id: (row.target_user_id as string | null) ?? null,
    target_resource: (row.target_resource as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
  }))
}

/** Read-only obligation estimate for stats display. */
export function estimateDailyProfitForRow(row: AdminInvestmentRow): number {
  return calculateDailyProfit({
    principalUsd: row.amount,
    weeklyRoiPercent: row.roi_percentage,
    compoundMode: row.compound_mode,
    currentValueUsd: row.current_value,
  })
}
