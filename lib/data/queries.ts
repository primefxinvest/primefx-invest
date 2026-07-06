import { getCurrentUser, supabase } from '@/lib/supabase'
import {
  getInvestmentPlans,
  getPaymentMethods,
  getReferrals,
  getUser,
  getUserCourses,
  getUserInvestments,
  getUserPortfolio,
  getUserTransactions,
  getUserTransactionsSince,
  getWallet,
  getMarketAssets,
  getAcademyCourses,
  getAcademyCourseById,
  getAcademyLessonsByCourseId,
  getUserCourseEnrollment,
  getUserLessonProgress,
  getCommunityPosts,
  getSupportTickets,
  getSupportTicketById,
  getSupportTicketMessages,
  getUserPreferences,
  upsertUserPreferences,
  getMarketInsights,
  getRewardsTiers,
  getRewardCatalog,
} from '@/lib/db/supabase'
import { getCachedUserTransactions } from '@/lib/data/user-transactions-cache'
import { mapDbPlansToInvestmentPlans, PLAN_UI_META, getPlanCategoryColorClass } from '@/lib/invest/plan-mapper'
import {
  buildInvestmentSequenceMap,
  calculateAccumulatedProfit,
  calculateWeeklyEarnings,
  computeInvestmentSummaryStats,
  formatInvestmentDisplayId,
  getNextWeeklyPayoutDate,
  resolveWeeklyRoiPercent,
  type InvestmentPositionInput,
} from '@/lib/invest/investment-metrics'
import {
  buildMonthlyReturnPoints,
  buildPortfolioChartData,
  computePortfolioPerformanceStats,
  type PortfolioChartPeriod,
} from '@/lib/data/portfolio-performance'
import { mapDbTransactionToItem } from '@/lib/data/transaction-map'
import type { InvestmentDbRow, TransactionDbRow } from '@/lib/data/db-rows'
import { formatCurrency, formatDate, formatDateTime, formatPercent, formatRelativeTime, toNumber } from '@/lib/data/format'
import { buildReferralLink } from '@/lib/referral/share'
import type {
  AcademyCourseDetail,
  AcademyCourseItem,
  AcademyLessonItem,
  AcademyStats,
  AssetAllocationItem,
  CapitalWithdrawalRequestItem,
  ChartPoint,
  CommunityMemberItem,
  CommunityPostItem,
  InvestmentPlan,
  LearningProgress,
  MarketInsightItem,
  MarketItem,
  NotificationItem,
  PaymentMethod,
  InvestmentSummaryStats,
  PortfolioInvestmentItem,
  PortfolioInvestmentWithdrawalItem,
  PortfolioMetrics,
  ReferralData,
  RewardAchievement,
  RewardCatalogItem,
  RewardTierItem,
  RewardsData,
  SupportTicketItem,
  SupportTicketDetail,
  SupportTicketMessage,
  TransactionItem,
  UserPreferencesData,
  WalletActivitySummary,
  WalletData,
  WalletHealthData,
  DashboardCoreData,
} from '@/lib/data/types'



async function requireUserId() {
  const { data: user } = await getCurrentUser()
  return user?.id ?? null
}

function metricsTransactionWindowStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() - 1, 1)
}

function sumTransactionsInMonth(
  transactions: Array<{ type?: string | null; amount?: unknown; created_at: string }>,
  monthOffset: number,
  matcher: (type: string) => boolean
) {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59, 999)

  return transactions.reduce((sum, tx) => {
    const created = new Date(tx.created_at)
    if (created < start || created > end) return sum
    const type = (tx.type ?? '').toLowerCase()
    if (!matcher(type)) return sum
    return sum + Math.abs(toNumber(tx.amount as string | number | null | undefined))
  }, 0)
}

function formatMonthOverMonthChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? '+100%' : '0%'
  }
  const pct = ((current - previous) / previous) * 100
  return formatPercent(pct, { signed: true })
}

function formatCourseDurationWeeks(minutes?: number | null) {
  const weeks = Math.max(1, Math.round((minutes ?? 60) / (60 * 7)))
  return weeks
}

function mapAcademyCourseRow(
  course: Record<string, unknown>,
  progressRow?: Record<string, unknown> | null
): AcademyCourseItem {
  const progress = toNumber(progressRow?.progress_percentage as string | number | null | undefined)
  const completed = progress >= 100 || Boolean(progressRow?.completed_at)
  const difficulty = (course.difficulty as string) ?? 'Beginner'

  return {
    id: course.id as string,
    title: course.title as string,
    description: (course.description as string) ?? '',
    category: (course.category as string) ?? 'General',
    lessons: Number(course.lessons_count ?? 0),
    duration: String(formatCourseDurationWeeks(course.duration_minutes as number)),
    difficulty,
    instructor: (course.instructor_name as string) ?? 'PrimeFx Academy',
    progress,
    completed,
    locked: difficulty.toLowerCase() === 'advanced',
    lockReason: difficulty.toLowerCase() === 'advanced' ? 'Prime Investor' : undefined,
  }
}

export async function fetchInvestmentPlans(): Promise<InvestmentPlan[]> {
  const { data, error } = await getInvestmentPlans()

  if (error || !data?.length) {
    return []
  }

  return mapDbPlansToInvestmentPlans(data)
}

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const userId = await requireUserId()
  if (!userId) {
    return emptyPortfolioMetrics()
  }

  const { data: portfolio } = await getUserPortfolio(userId)
  const { data: transactions } = await getUserTransactionsSince(userId, metricsTransactionWindowStart())
  const txs = transactions ?? []
  const totalInvested = toNumber(portfolio?.total_invested)
  const currentValue = toNumber(portfolio?.current_value)
  const profit = toNumber(portfolio?.profit_loss)
  const roi = toNumber(portfolio?.roi_percentage)

  const investedThis = sumTransactionsInMonth(txs, 0, (type) => type.includes('investment'))
  const investedLast = sumTransactionsInMonth(txs, -1, (type) => type.includes('investment'))
  const profitThis = sumTransactionsInMonth(
    txs,
    0,
    (type) => type.includes('profit') || type.includes('bonus') || type.includes('referral')
  )
  const profitLast = sumTransactionsInMonth(
    txs,
    -1,
    (type) => type.includes('profit') || type.includes('bonus') || type.includes('referral')
  )
  const depositThis = sumTransactionsInMonth(txs, 0, (type) => type.includes('deposit'))
  const depositLast = sumTransactionsInMonth(txs, -1, (type) => type.includes('deposit'))
  const roiThis = investedThis > 0 ? (profitThis / investedThis) * 100 : 0
  const roiLast = investedLast > 0 ? (profitLast / investedLast) * 100 : 0

  return {
    totalInvested: formatCurrency(totalInvested),
    currentValue: formatCurrency(currentValue),
    totalProfit: formatCurrency(profit, { signed: true }),
    roiPercentage: formatPercent(roi, { signed: true }),
    trends: [
      { percentage: formatMonthOverMonthChange(investedThis, investedLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(depositThis + investedThis, depositLast + investedLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(profitThis, profitLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(roiThis, roiLast), label: 'from last month' },
    ],
  }
}

function emptyPortfolioMetrics(): PortfolioMetrics {
  return {
    totalInvested: formatCurrency(0),
    currentValue: formatCurrency(0),
    totalProfit: formatCurrency(0),
    roiPercentage: formatPercent(0),
    trends: [
      { percentage: '0.00%', label: 'from last month' },
      { percentage: '0.00%', label: 'from last month' },
      { percentage: '0.00%', label: 'from last month' },
      { percentage: '0.00%', label: 'from last month' },
    ],
  }
}

function emptyInvestmentSummaryStats(): InvestmentSummaryStats {
  return {
    activeCount: 0,
    totalWeeklyEarnings: formatCurrency(0),
    totalProfitsEarned: formatCurrency(0),
  }
}

function buildInvestmentSummaryStatsFromRows(
  investments: InvestmentDbRow[]
): InvestmentSummaryStats {
  const positions: InvestmentPositionInput[] = investments.map((row) => {
    const planName = row.investment_plans?.name ?? undefined
    const amount = toNumber(row.amount)
    return {
      id: String(row.id ?? ''),
      amount,
      currentValue: toNumber(row.current_value ?? row.amount),
      weeklyRoiPercent: resolveWeeklyRoiPercent(toNumber(row.roi_percentage), planName),
      status: String(row.status ?? 'Active'),
      createdAt: row.created_at,
      planName,
      referenceId: (row.reference_id as string | null) ?? null,
    }
  })

  const stats = computeInvestmentSummaryStats(positions)
  return {
    activeCount: stats.activeCount,
    totalWeeklyEarnings: formatCurrency(stats.totalWeeklyEarnings),
    totalProfitsEarned: formatCurrency(stats.totalProfitsEarned, { signed: true }),
  }
}

async function fetchWithdrawalHistoryByInvestment(
  userId: string
): Promise<Map<string, PortfolioInvestmentWithdrawalItem[]>> {
  const { data, error } = await supabase
    .from('investment_withdrawal_requests')
    .select('id, investment_id, amount_usd, status, requested_at, available_at, reference_id')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })

  const grouped = new Map<string, PortfolioInvestmentWithdrawalItem[]>()
  if (error || !data?.length) return grouped

  for (const row of data) {
    const investmentId = row.investment_id as string
    const items = grouped.get(investmentId) ?? []
    items.push({
      id: row.id as string,
      amountUsd: toNumber(row.amount_usd),
      status: String(row.status ?? 'pending_notice'),
      requestedAt: row.requested_at as string,
      availableAt: row.available_at as string,
      referenceId: (row.reference_id as string | null) ?? null,
    })
    grouped.set(investmentId, items)
  }

  return grouped
}

export async function fetchPortfolioChart(
  period: PortfolioChartPeriod = 'This Year'
): Promise<ChartPoint[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const [{ data: investments }, { data: portfolio }, transactions] = await Promise.all([
    getUserInvestments(userId),
    getUserPortfolio(userId),
    getCachedUserTransactions(userId),
  ])

  return buildPortfolioChartData({
    transactions,
    investments: investments ?? [],
    currentValue: toNumber(portfolio?.current_value),
    period,
  })
}

export async function fetchAssetAllocation(): Promise<AssetAllocationItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const { data: investments } = await getUserInvestments(userId)
  if (!investments?.length) return []

  const totals = new Map<string, { value: number; color: string }>()

  investments.forEach((investment) => {
    const planName = investment.investment_plans?.name ?? 'Mixed'
    const meta = PLAN_UI_META[planName]
    const className = meta?.assetClass ?? 'Mixed'
    const color = meta?.color ?? '#0052ff'
    const amount = toNumber(investment.current_value ?? investment.amount)
    const existing = totals.get(className) ?? { value: 0, color }
    totals.set(className, { value: existing.value + amount, color })
  })

  const total = Array.from(totals.values()).reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return []

  return Array.from(totals.entries()).map(([name, item]) => ({
    name,
    value: Math.round((item.value / total) * 100),
    color: item.color,
    amount: formatCurrency(item.value),
  }))
}

function buildPortfolioMetricsFromRows(
  portfolio: Record<string, unknown> | null | undefined,
  transactions: Array<{ type?: string | null; amount?: unknown; created_at: string }>
): PortfolioMetrics {
  const windowStart = metricsTransactionWindowStart()
  const txs = transactions.filter((tx) => new Date(tx.created_at) >= windowStart)
  const totalInvested = toNumber(portfolio?.total_invested as string | number | null | undefined)
  const currentValue = toNumber(portfolio?.current_value as string | number | null | undefined)
  const profit = toNumber(portfolio?.profit_loss as string | number | null | undefined)
  const roi = toNumber(portfolio?.roi_percentage as string | number | null | undefined)

  const investedThis = sumTransactionsInMonth(txs, 0, (type) => type.includes('investment'))
  const investedLast = sumTransactionsInMonth(txs, -1, (type) => type.includes('investment'))
  const profitThis = sumTransactionsInMonth(
    txs,
    0,
    (type) => type.includes('profit') || type.includes('bonus') || type.includes('referral')
  )
  const profitLast = sumTransactionsInMonth(
    txs,
    -1,
    (type) => type.includes('profit') || type.includes('bonus') || type.includes('referral')
  )
  const depositThis = sumTransactionsInMonth(txs, 0, (type) => type.includes('deposit'))
  const depositLast = sumTransactionsInMonth(txs, -1, (type) => type.includes('deposit'))
  const roiThis = investedThis > 0 ? (profitThis / investedThis) * 100 : 0
  const roiLast = investedLast > 0 ? (profitLast / investedLast) * 100 : 0

  return {
    totalInvested: formatCurrency(totalInvested),
    currentValue: formatCurrency(currentValue),
    totalProfit: formatCurrency(profit, { signed: true }),
    roiPercentage: formatPercent(roi, { signed: true }),
    trends: [
      { percentage: formatMonthOverMonthChange(investedThis, investedLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(depositThis + investedThis, depositLast + investedLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(profitThis, profitLast), label: 'from last month' },
      { percentage: formatMonthOverMonthChange(roiThis, roiLast), label: 'from last month' },
    ],
  }
}

function buildAssetAllocationFromInvestments(
  investments: InvestmentDbRow[]
): AssetAllocationItem[] {
  if (!investments.length) return []

  const totals = new Map<string, { value: number; color: string }>()

  investments.forEach((investment) => {
    const planName = investment.investment_plans?.name ?? 'Mixed'
    const meta = PLAN_UI_META[planName]
    const className = meta?.assetClass ?? 'Mixed'
    const color = meta?.color ?? '#0052ff'
    const amount = toNumber(investment.current_value ?? investment.amount)
    const existing = totals.get(className) ?? { value: 0, color }
    totals.set(className, { value: existing.value + amount, color })
  })

  const total = Array.from(totals.values()).reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return []

  return Array.from(totals.entries()).map(([name, item]) => ({
    name,
    value: Math.round((item.value / total) * 100),
    color: item.color,
    amount: formatCurrency(item.value),
  }))
}

async function buildWalletDataFromRow(
  userId: string,
  wallet: Record<string, unknown> | null | undefined
): Promise<WalletData> {
  const { formatPrimeFxId } = await import('@/lib/wallet/primefx-id')
  const available = toNumber(wallet?.available_balance as string | number | null | undefined)
  const pending = toNumber(wallet?.pending_balance as string | number | null | undefined)
  const bonus = toNumber(wallet?.bonus_balance as string | number | null | undefined)
  const total =
    toNumber(wallet?.total_balance as string | number | null | undefined) || available + pending + bonus

  const breakdown = [
    { label: 'Available Balance', value: available, color: '#10b981' },
    { label: 'Pending Balance', value: pending, color: '#f97316' },
    { label: 'Bonus Balance', value: bonus, color: '#8b5cf6' },
  ]

  return {
    userId,
    primeFxId: formatPrimeFxId(userId),
    availableBalance: formatCurrency(available),
    pendingBalance: formatCurrency(pending),
    bonusBalance: formatCurrency(bonus),
    totalBalance: formatCurrency(total),
    balanceBreakdown: breakdown.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
    })),
  }
}

/** Single bundled fetch for dashboard KPIs, wallet, allocation, and chart inputs. */
export async function fetchDashboardCoreData(): Promise<DashboardCoreData> {
  const userId = await requireUserId()
  if (!userId) {
    return {
      metrics: emptyPortfolioMetrics(),
      investmentStats: emptyInvestmentSummaryStats(),
      wallet: emptyWalletData(),
      allocation: [],
      investments: [],
      portfolioCurrentValue: 0,
      transactions: [],
    }
  }

  const [{ data: portfolio }, { data: wallet }, { data: investments }, transactions] =
    await Promise.all([
      getUserPortfolio(userId),
      getWallet(userId),
      getUserInvestments(userId),
      getCachedUserTransactions(userId),
    ])

  const investmentRows = (investments ?? []) as InvestmentDbRow[]
  const txRows = transactions as TransactionDbRow[]

  const [walletData, metrics, allocation] = await Promise.all([
    buildWalletDataFromRow(userId, wallet),
    Promise.resolve(
      buildPortfolioMetricsFromRows(
        portfolio,
        txRows as Array<{ type?: string | null; amount?: unknown; created_at: string }>
      )
    ),
    Promise.resolve(buildAssetAllocationFromInvestments(investmentRows)),
  ])

  const investmentStats = buildInvestmentSummaryStatsFromRows(investmentRows)

  return {
    metrics,
    investmentStats,
    wallet: walletData,
    allocation,
    investments: investmentRows,
    portfolioCurrentValue: toNumber(portfolio?.current_value),
    transactions: txRows,
  }
}

export async function fetchRecentTransactions(limit = 4): Promise<TransactionItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const data = await getCachedUserTransactions(userId)
  if (!data.length) return []

  return data.slice(0, limit).map((tx) =>
    mapDbTransactionToItem(
      {
        id: tx.id as string,
        type: tx.type as string,
        amount: tx.amount,
        status: tx.status as string,
        description: tx.description as string | null,
        reference_id: tx.reference_id as string | null,
        created_at: tx.created_at as string,
      },
      'recent'
    )
  )
}

export async function fetchWalletData(): Promise<WalletData> {
  const userId = await requireUserId()
  if (!userId) return emptyWalletData()

  const { formatPrimeFxId } = await import('@/lib/wallet/primefx-id')
  const { data: wallet } = await getWallet(userId)
  const available = toNumber(wallet?.available_balance)
  const pending = toNumber(wallet?.pending_balance)
  const bonus = toNumber(wallet?.bonus_balance)
  const total = toNumber(wallet?.total_balance) || available + pending + bonus

  const breakdown = [
    { label: 'Available Balance', value: available, color: '#10b981' },
    { label: 'Pending Balance', value: pending, color: '#f97316' },
    { label: 'Bonus Balance', value: bonus, color: '#8b5cf6' },
  ]

  return {
    userId,
    primeFxId: formatPrimeFxId(userId),
    availableBalance: formatCurrency(available),
    pendingBalance: formatCurrency(pending),
    bonusBalance: formatCurrency(bonus),
    totalBalance: formatCurrency(total),
    balanceBreakdown: breakdown.map((item) => ({
      ...item,
      percentage: total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0,
    })),
  }
}

function emptyWalletData(): WalletData {
  return {
    availableBalance: formatCurrency(0),
    pendingBalance: formatCurrency(0),
    bonusBalance: formatCurrency(0),
    totalBalance: formatCurrency(0),
    balanceBreakdown: [],
  }
}

export async function fetchWalletTransactions(): Promise<TransactionItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const data = await getCachedUserTransactions(userId)
  if (!data.length) return []

  return data.map((tx) =>
    mapDbTransactionToItem(
      {
        id: tx.id as string,
        type: tx.type as string,
        amount: tx.amount,
        status: tx.status as string,
        description: tx.description as string | null,
        reference_id: tx.reference_id as string | null,
        created_at: tx.created_at as string,
      },
      'wallet'
    )
  )
}

export async function fetchWalletActivitySummary(): Promise<WalletActivitySummary> {
  const userId = await requireUserId()
  if (!userId) {
    return {
      period: 'This Month',
      deposits: { value: formatCurrency(0), change: '0%', trend: 'up' },
      withdrawals: { value: formatCurrency(0), change: '0%', trend: 'up' },
      transfers: { value: formatCurrency(0), change: '0%', trend: 'up' },
      bonuses: { value: formatCurrency(0), change: '0%', trend: 'up' },
    }
  }

  const data = await getCachedUserTransactions(userId)
  const now = new Date()

  const sums = { deposit: 0, withdrawal: 0, transfer: 0, bonus: 0 }
  const prevSums = { deposit: 0, withdrawal: 0, transfer: 0, bonus: 0 }
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  data?.forEach((tx) => {
    const created = new Date(tx.created_at)
    const type = (tx.type ?? '').toLowerCase()
    const amount = Math.abs(toNumber(tx.amount))
    const bucket =
      type.includes('deposit')
        ? 'deposit'
        : type.includes('withdraw')
          ? 'withdrawal'
          : type.includes('transfer')
            ? 'transfer'
            : type.includes('bonus') || type.includes('profit') || type.includes('referral')
              ? 'bonus'
              : null
    if (!bucket) return

    if (created >= monthStart) {
      sums[bucket] += amount
    } else if (created >= prevMonthStart && created <= prevMonthEnd) {
      prevSums[bucket] += amount
    }
  })

  const formatTrend = (value: number, previous: number) => ({
    value: formatCurrency(value),
    change: formatMonthOverMonthChange(value, previous),
    trend: value >= previous ? ('up' as const) : ('down' as const),
  })

  return {
    period: 'This Month',
    deposits: formatTrend(sums.deposit, prevSums.deposit),
    withdrawals: formatTrend(sums.withdrawal, prevSums.withdrawal),
    transfers: formatTrend(sums.transfer, prevSums.transfer),
    bonuses: formatTrend(sums.bonus, prevSums.bonus),
  }
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const { data } = await getPaymentMethods(userId)
  if (!data?.length) return []

  return data.map((method) => ({
    id: method.id,
    type: normalizePaymentType(method.method_type),
    label: formatPaymentLabel(method.method_type),
    detail: method.last_four ? `Ending in ${method.last_four}` : 'Connected',
    badge: method.is_primary ? 'Primary' : 'Active',
  }))
}

export async function fetchMarketOverview(): Promise<MarketItem[]> {
  const { data } = await getMarketAssets()
  if (!data?.length) return []

  return data.map((asset) => ({
    id: asset.id,
    symbol: asset.symbol,
    price: asset.price,
    change: asset.change,
    trend: asset.trend === 'down' ? 'down' : 'up',
    icon: asset.icon,
  }))
}

export async function fetchReferralData(): Promise<ReferralData> {
  const userId = await requireUserId()
  if (!userId) {
    return { referralLink: '', referralCode: '', totalReferrals: 0, totalEarnings: formatCurrency(0) }
  }

  const [{ data: user }, { data: referrals }] = await Promise.all([
    getUser(userId),
    getReferrals(userId),
  ])

  const totalEarnings =
    referrals?.reduce((sum, row) => sum + toNumber(row.bonus_earned), 0) ?? 0

  const referralCode =
    (user?.referral_code as string | undefined)?.trim() ||
    userId.slice(0, 8)

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.primefxinvest.com'

  return {
    referralLink: buildReferralLink(origin, referralCode),
    referralCode,
    totalReferrals: referrals?.length ?? 0,
    totalEarnings: formatCurrency(totalEarnings),
  }
}

export async function fetchRewardsData(): Promise<RewardsData> {
  const userId = await requireUserId()
  if (!userId) {
    return {
      currentTier: 'Bronze Level',
      nextTier: 'Silver Level',
      points: '0 / 500 XP',
      totalPoints: 0,
      nextLevel: 'Next: Silver Level',
      progress: 0,
    }
  }

  const [{ data: referrals }, { data: investments }] = await Promise.all([
    getReferrals(userId),
    getUserInvestments(userId),
  ])

  const points = (referrals?.length ?? 0) * 50 + (investments?.length ?? 0) * 100
  const { data: tierRows } = await getRewardsTiers()

  const tiers =
    tierRows?.map((row, index, arr) => {
      const min = Number(row.minimum_points ?? 0)
      const next = arr[index + 1]
      const max = next ? Number(next.minimum_points) - 1 : min + 5000
      return { name: row.tier_name as string, min, max }
    }) ?? [
      { name: 'Bronze Level', min: 0, max: 500 },
      { name: 'Silver Level', min: 501, max: 1500 },
      { name: 'Gold Level', min: 1501, max: 3000 },
      { name: 'Platinum Level', min: 3001, max: 5000 },
    ]

  const current = tiers.find((tier) => points >= tier.min && points <= tier.max) ?? tiers[0]
  const currentIndex = tiers.indexOf(current)
  const next = tiers[currentIndex + 1] ?? current
  const progressMax = current.max
  const progress = Math.min(100, Math.round((points / progressMax) * 100))

  return {
    currentTier: current.name,
    nextTier: next.name,
    points: `${points.toLocaleString()} / ${progressMax.toLocaleString()} XP`,
    totalPoints: points,
    nextLevel: `Next: ${next.name}`,
    progress,
  }
}

export async function fetchRewardAchievements(): Promise<RewardAchievement[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const [{ data: referrals }, { data: investments }, learning] = await Promise.all([
    getReferrals(userId),
    getUserInvestments(userId),
    fetchLearningProgress(),
  ])

  const investmentCount = investments?.length ?? 0
  const referralCount = referrals?.length ?? 0
  const uniquePlans = new Set(
    investments?.map((inv) => (inv.plan_id as string | undefined) ?? '').filter(Boolean)
  ).size
  const portfolioValue =
    investments?.reduce(
      (sum, inv) => sum + toNumber(inv.current_value ?? inv.amount),
      0
    ) ?? 0

  const firstInvestment = investments?.[0]?.created_at as string | undefined

  return [
    {
      id: '1',
      name: 'Early Bird Investor',
      description: 'Make your first investment',
      points: 100,
      earned: investmentCount >= 1,
      earnedDate: firstInvestment ? formatDate(firstInvestment) : undefined,
    },
    {
      id: '2',
      name: 'Portfolio Builder',
      description: 'Invest in 3+ different plans',
      points: 250,
      earned: uniquePlans >= 3,
      progress: Math.min(uniquePlans, 3),
      progressMax: 3,
    },
    {
      id: '3',
      name: 'Active Investor',
      description: 'Maintain 2+ active investments',
      points: 150,
      earned: (investments?.filter((i) => (i.status ?? '').toLowerCase() === 'active').length ?? 0) >= 2,
      progress: investments?.filter((i) => (i.status ?? '').toLowerCase() === 'active').length ?? 0,
      progressMax: 2,
    },
    {
      id: '4',
      name: 'Referral Master',
      description: 'Refer 3 investors to PrimeFX',
      points: 500,
      earned: referralCount >= 3,
      progress: Math.min(referralCount, 3),
      progressMax: 3,
    },
    {
      id: '5',
      name: 'Market Analyst',
      description: 'Complete all academy courses',
      points: 300,
      earned: learning.coursesCompleted >= 5,
      progress: learning.coursesCompleted,
      progressMax: 5,
    },
    {
      id: '6',
      name: 'Millionaire Investor',
      description: 'Reach $1,000,000 portfolio value',
      points: 1000,
      earned: portfolioValue >= 1_000_000,
      progress: Math.min(portfolioValue, 1_000_000),
      progressMax: 1_000_000,
    },
  ]
}

export async function fetchLearningProgress(): Promise<LearningProgress> {
  const userId = await requireUserId()
  if (!userId) {
    return { completed: 0, total: 100, coursesCompleted: 0, label: 'Courses Completed' }
  }

  const { data } = await getUserCourses(userId)
  if (!data?.length) {
    return { completed: 0, total: 100, coursesCompleted: 0, label: 'Courses Completed' }
  }

  const completed = data.filter((course) => toNumber(course.progress_percentage) >= 100).length
  const avgProgress =
    data.reduce((sum, course) => sum + toNumber(course.progress_percentage), 0) / data.length

  return {
    completed: Math.round(avgProgress),
    total: 100,
    coursesCompleted: completed,
    label: 'Courses Completed',
  }
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data?.length) {
      return data.map((row) => {
        const type = String(row.type ?? 'general')
        const notificationType: NotificationItem['type'] =
          type === 'wallet' ||
          type === 'investment' ||
          type === 'security' ||
          type === 'reward' ||
          type === 'general'
            ? (type as NotificationItem['type'])
            : 'general'

        return {
          id: row.id as string,
          title: row.title as string,
          message: row.message as string,
          time: formatRelativeTime(row.created_at as string),
          read: Boolean(row.read_at),
          type: notificationType,
          createdAt: row.created_at as string,
        }
      })
    }
  } catch {
    // Table may not exist before migration 009
  }

  const { data } = await getUserTransactions(userId)
  if (!data?.length) return []

  return data.slice(0, 8).map((tx) => ({
    id: tx.id,
    title: notificationTitle(tx.type),
    message: tx.description ?? `Transaction ${tx.type}`,
    time: formatRelativeTime(tx.created_at),
    read: (tx.status ?? '').toLowerCase() !== 'pending',
    type: notificationType(tx.type),
    createdAt: tx.created_at as string,
  }))
}

function normalizeTransactionType(type?: string | null) {
  const value = (type ?? 'deposit').toLowerCase()
  if (value.includes('withdraw')) return 'Withdrawal'
  if (value.includes('investment')) return 'Investment'
  if (value.includes('profit')) return 'Profit'
  if (value.includes('bonus') || value.includes('referral')) return 'Bonus'
  if (value.includes('transfer')) return 'Transfer'
  return 'Deposit'
}

function isCreditTransactionType(type?: string | null) {
  const value = (type ?? '').toLowerCase()
  return (
    value.includes('deposit') ||
    value.includes('bonus') ||
    value.includes('profit') ||
    value.includes('referral') ||
    value.includes('transfer_received')
  )
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function normalizePaymentType(type?: string | null): PaymentMethod['type'] {
  const value = (type ?? '').toLowerCase()
  if (value.includes('crypto') || value.includes('usdt') || value.includes('btc')) return 'crypto'
  if (value.includes('card')) return 'card'
  return 'crypto'
}

function formatPaymentLabel(type?: string | null) {
  const value = (type ?? 'crypto').toLowerCase()
  if (value.includes('usdt')) return 'USDT (TRC20)'
  if (value.includes('btc')) return 'Bitcoin (BTC)'
  return 'NOWPayments'
}

function notificationTitle(type?: string | null) {
  const value = (type ?? '').toLowerCase()
  if (value.includes('investment')) return 'Investment confirmed'
  if (value.includes('profit')) return 'Investment payout received'
  if (value.includes('bonus') || value.includes('referral')) return 'Referral bonus earned'
  if (value.includes('withdraw')) return 'Withdrawal processed'
  if (value.includes('deposit')) return 'Deposit confirmed'
  return 'Account activity'
}

function notificationType(type?: string | null): NotificationItem['type'] {
  const value = (type ?? '').toLowerCase()
  if (value.includes('profit') || value.includes('investment')) return 'payout'
  if (value.includes('bonus') || value.includes('referral')) return 'reward'
  if (value.includes('deposit') || value.includes('withdraw')) return 'wallet'
  return 'security'
}

// Portfolio page exports
export async function fetchReferralProgramOverview() {
  const [referralData, referrals] = await Promise.all([fetchReferralData(), fetchReferralList()])
  const { buildReferralProgramOverview } = await import('@/lib/referral/analytics')
  return {
    referralData,
    referrals,
    overview: buildReferralProgramOverview(referrals, referralData.totalReferrals),
  }
}

export async function fetchReferralList() {
  const userId = await requireUserId()
  if (!userId) return []

  const { data } = await getReferrals(userId)
  if (!data?.length) return []

  const referredIds = data
    .map((row) => row.referred_user_id as string)
    .filter(Boolean)

  const referredUsers = new Map<string, { full_name?: string; email?: string }>()
  if (referredIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', referredIds)

    users?.forEach((user) => {
      referredUsers.set(user.id as string, {
        full_name: user.full_name as string | undefined,
        email: user.email as string | undefined,
      })
    })
  }

  return data.map((row) => {
    const referredId = row.referred_user_id as string
    const referred = referredUsers.get(referredId)

    return {
      id: row.id as string,
      name: referred?.full_name || `Investor ${referredId.slice(0, 8)}`,
      email: referred?.email || 'Referred investor',
      status: (row.status as string) ?? 'Pending',
      commissionEarned: toNumber(row.bonus_earned),
      joinedDate: formatDate(row.created_at as string),
      tradingVolume: formatCurrency(toNumber(row.bonus_earned) * 20),
    }
  })
}

export async function fetchPortfolioOverview() {
  const userId = await requireUserId()
  const metrics = await fetchPortfolioMetrics()
  const { data: investments } = userId ? await getUserInvestments(userId) : { data: [] }
  const investmentStats = buildInvestmentSummaryStatsFromRows((investments ?? []) as InvestmentDbRow[])

  return {
    totalInvested: metrics.totalInvested,
    currentValue: metrics.currentValue,
    profitLoss: metrics.totalProfit,
    roi: metrics.roiPercentage,
    activePlans: investmentStats.activeCount,
    totalWeeklyEarnings: investmentStats.totalWeeklyEarnings,
    totalProfitsEarned: investmentStats.totalProfitsEarned,
  }
}

export async function fetchPortfolioInvestments(): Promise<{
  active: PortfolioInvestmentItem[]
  completed: ReturnType<typeof mapCompletedInvestmentRow>[]
}> {
  const userId = await requireUserId()
  if (!userId) return { active: [], completed: [] }

  const [{ data }, withdrawalHistory] = await Promise.all([
    getUserInvestments(userId),
    fetchWithdrawalHistoryByInvestment(userId),
  ])

  if (!data?.length) return { active: [], completed: [] }

  const sequenceMap = buildInvestmentSequenceMap(
    data.map((row) => ({
      id: row.id as string,
      created_at: row.created_at as string,
    }))
  )

  const active = data
    .filter((i) => (i.status ?? '').toLowerCase() === 'active')
    .map((row) =>
      mapInvestmentRow(
        row as Record<string, unknown>,
        sequenceMap.get(row.id as string) ?? 0,
        withdrawalHistory.get(row.id as string) ?? []
      )
    )
  const completed = data
    .filter((i) => (i.status ?? '').toLowerCase() !== 'active')
    .map((row) =>
      mapCompletedInvestmentRow(
        row as Record<string, unknown>,
        sequenceMap.get(row.id as string) ?? 0,
        withdrawalHistory.get(row.id as string) ?? []
      )
    )

  return { active, completed }
}

export async function fetchCapitalWithdrawalRequests(): Promise<CapitalWithdrawalRequestItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const { data, error } = await supabase
    .from('investment_withdrawal_requests')
    .select('id, investment_id, amount_usd, status, requested_at, available_at, reference_id')
    .eq('user_id', userId)
    .in('status', ['pending_notice', 'ready'])
    .order('requested_at', { ascending: false })

  if (error || !data?.length) return []

  return data.map((row) => ({
    id: row.id as string,
    investmentId: row.investment_id as string,
    amountUsd: toNumber(row.amount_usd),
    status: String(row.status ?? 'pending_notice'),
    requestedAt: row.requested_at as string,
    availableAt: row.available_at as string,
    referenceId: (row.reference_id as string | null) ?? null,
  }))
}

function mapInvestmentRow(
  investment: Record<string, unknown>,
  sequence: number,
  withdrawalHistory: PortfolioInvestmentWithdrawalItem[] = []
): PortfolioInvestmentItem {
  const plan = investment.investment_plans as {
    name?: string
    weekly_roi?: number | string | null
  } | undefined
  const planName = plan?.name ?? 'Investment'
  const meta = PLAN_UI_META[planName]
  const invested = toNumber(investment.amount as string | number | null | undefined)
  const current = toNumber(
    (investment.current_value ?? investment.amount) as string | number | null | undefined
  )
  const weeklyReturnPercent = resolveWeeklyRoiPercent(
    toNumber(investment.roi_percentage as string | number | null | undefined),
    planName
  )
  const displayWeekly =
    meta?.displayWeeklyRoi ?? `${weeklyReturnPercent}%`
  const roi = invested > 0 ? ((current - invested) / invested) * 100 : 0
  const accumulated = calculateAccumulatedProfit(invested, current)
  const referenceId = (investment.reference_id as string | null) ?? null

  return {
    id: investment.id as string,
    displayId: sequence > 0 ? formatInvestmentDisplayId(sequence) : referenceId ?? 'INV',
    referenceId,
    plan: planName,
    category: meta?.badge ?? 'INVESTMENT PLAN',
    categoryColor: getPlanCategoryColorClass(planName),
    iconBg: 'bg-blue-100 text-blue-600',
    invested: formatCurrency(invested),
    investedAmount: invested,
    currentValue: formatCurrency(current),
    weeklyReturn: displayWeekly,
    weeklyReturnPercent,
    createdAt: formatDate(investment.created_at as string),
    nextPayoutDate: formatDate(getNextWeeklyPayoutDate().toISOString()),
    accumulatedProfit: formatCurrency(accumulated, { signed: true }),
    roi: formatPercent(roi, { signed: true }),
    status: capitalize((investment.status as string) ?? 'Active'),
    withdrawalHistory,
  }
}

function mapCompletedInvestmentRow(
  investment: Record<string, unknown>,
  sequence = 0,
  withdrawalHistory: PortfolioInvestmentWithdrawalItem[] = []
) {
  const plan = investment.investment_plans as {
    name?: string
    weekly_roi?: number | string | null
  } | undefined
  const planName = plan?.name ?? 'Investment'
  const meta = PLAN_UI_META[planName]
  const invested = toNumber(investment.amount as string | number | null | undefined)
  const finalValue = toNumber(
    (investment.current_value ?? investment.amount) as string | number | null | undefined
  )
  const profit = finalValue - invested
  const weeklyReturnPercent = resolveWeeklyRoiPercent(
    toNumber(investment.roi_percentage as string | number | null | undefined),
    planName
  )
  const referenceId = (investment.reference_id as string | null) ?? null

  return {
    id: investment.id as string,
    displayId: sequence > 0 ? formatInvestmentDisplayId(sequence) : referenceId ?? 'INV',
    plan: planName,
    weeklyReturn: meta?.displayWeeklyRoi ?? `${weeklyReturnPercent}%`,
    createdAt: formatDate(investment.created_at as string),
    date: formatDate(investment.end_date as string ?? investment.created_at as string),
    invested: formatCurrency(invested),
    finalValue: formatCurrency(finalValue),
    profit: formatCurrency(profit, { signed: true }),
    status: capitalize((investment.status as string) ?? 'Completed'),
    withdrawalHistory,
  }
}

export async function fetchMonthlyReturns(
  period: PortfolioChartPeriod = 'This Year',
  chart?: ChartPoint[]
): Promise<ChartPoint[]> {
  const source = chart ?? (await fetchPortfolioChart(period))
  return buildMonthlyReturnPoints(source)
}

export type PortfolioChartsBundle = {
  chart: ChartPoint[]
  monthlyReturns: ChartPoint[]
  performanceStats: ReturnType<typeof computePortfolioPerformanceStats>
}

export async function fetchPortfolioChartsBundle(
  period: PortfolioChartPeriod = '1Y'
): Promise<PortfolioChartsBundle> {
  const chart = await fetchPortfolioChart(period)
  const monthlyReturns = buildMonthlyReturnPoints(chart)
  return {
    chart,
    monthlyReturns,
    performanceStats: computePortfolioPerformanceStats(monthlyReturns),
  }
}

export async function fetchAcademyCourses(): Promise<AcademyCourseItem[]> {
  const userId = await requireUserId()
  const [{ data: courses }, { data: progressRows }] = await Promise.all([
    getAcademyCourses(),
    userId ? getUserCourses(userId) : Promise.resolve({ data: [] }),
  ])

  if (!courses?.length) return []

  const progressMap = new Map(
    (progressRows ?? []).map((row) => [row.course_id as string, row])
  )

  return courses.map((course) => {
    const progressRow = progressMap.get(course.id as string)
    return mapAcademyCourseRow(course as Record<string, unknown>, progressRow)
  })
}

export async function fetchAcademyCourseDetail(
  courseId: string
): Promise<AcademyCourseDetail | null> {
  const userId = await requireUserId()
  const [{ data: course }, { data: lessons }] = await Promise.all([
    getAcademyCourseById(courseId),
    getAcademyLessonsByCourseId(courseId),
  ])

  if (!course) return null

  const enrollment = userId
    ? (await getUserCourseEnrollment(userId, courseId)).data
    : null

  const lessonIds = (lessons ?? []).map((row) => row.id as string)
  const { data: progressRows } = userId
    ? await getUserLessonProgress(userId, lessonIds)
    : { data: [] }

  const completedLessonIds = new Set(
    (progressRows ?? []).map((row) => row.lesson_id as string)
  )

  const lessonsList: AcademyLessonItem[] = (lessons ?? []).map((lesson) => ({
    id: lesson.id as string,
    title: lesson.title as string,
    description: (lesson.description as string) ?? '',
    content:
      (lesson.content as string) ??
      'Review this lesson material and mark it complete when you are ready to continue.',
    contentType: (lesson.content_type as string) ?? 'article',
    sortOrder: Number(lesson.sort_order ?? 0),
    durationMinutes: Number(lesson.duration_minutes ?? 10),
    completed: completedLessonIds.has(lesson.id as string),
  }))

  const base = mapAcademyCourseRow(
    course as Record<string, unknown>,
    enrollment as Record<string, unknown> | null
  )

  return {
    ...base,
    enrolled: Boolean(enrollment),
    enrolledAt: enrollment?.created_at as string | undefined,
    completedAt: enrollment?.completed_at as string | undefined,
    lessonsList,
  }
}

export async function fetchAcademyStats(): Promise<AcademyStats> {
  const userId = await requireUserId()
  const [{ data: courses }, { data: progressRows }] = await Promise.all([
    getAcademyCourses(),
    userId ? getUserCourses(userId) : Promise.resolve({ data: [] }),
  ])

  const totalCourses = courses?.length ?? 0
  const completed =
    progressRows?.filter(
      (row) =>
        toNumber(row.progress_percentage) >= 100 || Boolean(row.completed_at)
    ).length ?? 0

  const xpEarned =
    progressRows?.reduce((sum, row) => {
      const pct = toNumber(row.progress_percentage)
      return sum + Math.round((pct / 100) * 250)
    }, 0) ?? 0

  return {
    coursesCompleted: completed,
    totalCourses,
    xpEarned,
    learningStreakDays: completed > 0 ? Math.min(completed * 7, 30) : 0,
  }
}

export async function fetchCommunityPosts(): Promise<CommunityPostItem[]> {
  const { data } = await getCommunityPosts()
  if (!data?.length) return []

  return data.map((post) => {
    const user = post.users as { full_name?: string; email?: string } | null
    const authorId = post.user_id as string
    const author =
      user?.full_name?.trim() ||
      user?.email?.split('@')[0] ||
      `Member ${authorId.slice(0, 6)}`

    return {
      id: post.id as string,
      author,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(authorId)}`,
      title: post.title as string,
      content: post.content as string,
      category: (post.category as string) ?? 'general',
      likes: Number(post.likes_count ?? 0),
      comments: Number(post.comments_count ?? 0),
      timestamp: formatRelativeTime(post.created_at as string),
    }
  })
}

export async function fetchCommunityTopMembers(): Promise<CommunityMemberItem[]> {
  const { data } = await getCommunityPosts(200)
  if (!data?.length) return []

  const counts = new Map<string, { name: string; posts: number }>()
  for (const post of data) {
    const userId = post.user_id as string
    const user = post.users as { full_name?: string; email?: string } | null
    const name =
      user?.full_name?.trim() ||
      user?.email?.split('@')[0] ||
      `Member ${userId.slice(0, 6)}`
    const existing = counts.get(userId) ?? { name, posts: 0 }
    counts.set(userId, { name, posts: existing.posts + 1 })
  }

  const maxPosts = Math.max(1, ...Array.from(counts.values()).map((row) => row.posts))

  return Array.from(counts.entries())
    .sort((a, b) => b[1].posts - a[1].posts)
    .slice(0, 4)
    .map(([id, row]) => ({
      id,
      name: row.name,
      posts: row.posts,
      engagement: Math.round((row.posts / maxPosts) * 100),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`,
    }))
}

export async function fetchSupportTickets(): Promise<SupportTicketItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const { data } = await getSupportTickets(userId)
  if (!data?.length) return []

  const ticketIds = data.map((row) => row.id as string)
  const replyCounts = new Map<string, number>()
  await Promise.all(
    ticketIds.map(async (ticketId) => {
      const { data: rows } = await getSupportTicketMessages(ticketId)
      replyCounts.set(ticketId, rows?.length ?? 0)
    })
  )

  return data.map((ticket) => {
    const ticketId = ticket.id as string
    const ticketNumber = ticket.ticket_number as string | undefined
    return {
      id: ticketNumber ?? ticketId.slice(0, 8).toUpperCase(),
      ticketId,
      subject: ticket.subject as string,
      description: ticket.description as string,
      status: (ticket.status as string) ?? 'open',
      priority: (ticket.priority as string) ?? 'medium',
      created: formatDate(ticket.created_at as string),
      updated: formatDate(ticket.updated_at as string),
      replyCount: replyCounts.get(ticketId) ?? 0,
    }
  })
}

export async function fetchSupportTicketDetail(
  ticketId: string
): Promise<SupportTicketDetail | null> {
  const userId = await requireUserId()
  if (!userId) return null

  const { data: ticket } = await getSupportTicketById(ticketId, userId)
  if (!ticket) return null

  const { data: messageRows } = await getSupportTicketMessages(ticketId)
  const { data: profile } = await getUser(userId)
  const userName =
    (profile?.full_name as string | undefined)?.trim() ||
    (profile?.email as string | undefined)?.split('@')[0] ||
    'You'

  const threadMessages: SupportTicketMessage[] = [
    {
      id: `initial-${ticketId}`,
      senderType: 'user',
      senderName: userName,
      message: ticket.description as string,
      createdAt: formatDateTime(ticket.created_at as string),
    },
    ...(messageRows ?? []).map((row) => ({
      id: row.id as string,
      senderType: row.sender_type as 'user' | 'admin',
      senderName: row.sender_type === 'admin' ? 'Support Team' : userName,
      message: row.message as string,
      createdAt: formatDateTime(row.created_at as string),
    })),
  ]

  return {
    id: (ticket.ticket_number as string) ?? ticketId.slice(0, 8).toUpperCase(),
    ticketId,
    subject: ticket.subject as string,
    description: ticket.description as string,
    status: (ticket.status as string) ?? 'open',
    priority: (ticket.priority as string) ?? 'medium',
    created: formatDate(ticket.created_at as string),
    updated: formatDate(ticket.updated_at as string),
    replyCount: messageRows?.length ?? 0,
    messages: threadMessages,
  }
}

export async function fetchSupportTicketStats() {
  const tickets = await fetchSupportTickets()
  return {
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in-progress' || t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
  }
}

export async function fetchMarketInsightArticles(locale: string): Promise<MarketInsightItem[]> {
  const { data } = await getMarketInsights()
  if (!data?.length) return []

  const localeKey = ['de', 'es', 'fr'].includes(locale) ? locale : 'en'

  return data.map((row) => {
    const title =
      (row[`title_${localeKey}` as keyof typeof row] as string | undefined) ||
      (row.title_en as string)
    const summary =
      (row[`summary_${localeKey}` as keyof typeof row] as string | undefined) ||
      (row.summary_en as string)
    const sentiment = String(row.sentiment ?? 'neutral').toLowerCase()

    return {
      id: row.id as string,
      title,
      summary,
      tag: (row.tag as string) ?? 'Markets',
      sentiment:
        sentiment === 'bullish' || sentiment === 'bearish'
          ? sentiment
          : 'neutral',
    }
  })
}

export async function fetchUserPreferences(): Promise<UserPreferencesData> {
  const userId = await requireUserId()
  if (!userId) {
    return {
      theme: 'auto',
      currency: 'usd',
      profileVisibility: 'public',
      emailNotifications: true,
      investmentAlerts: true,
      securityAlerts: true,
    }
  }

  const { data } = await getUserPreferences(userId)
  if (!data) {
    return {
      theme: 'auto',
      currency: 'usd',
      profileVisibility: 'public',
      emailNotifications: true,
      investmentAlerts: true,
      securityAlerts: true,
    }
  }

  return {
    theme: (data.theme as string) ?? 'auto',
    currency: (data.currency as string) ?? 'usd',
    profileVisibility: (data.profile_visibility as string) ?? 'public',
    emailNotifications: Boolean(data.email_notifications ?? true),
    investmentAlerts: Boolean(data.investment_alerts ?? true),
    securityAlerts: Boolean(data.security_alerts ?? true),
  }
}

export async function saveUserPreferences(
  preferences: Partial<UserPreferencesData>
): Promise<{ ok: boolean; error?: string }> {
  const userId = await requireUserId()
  if (!userId) return { ok: false, error: 'Not authenticated' }

  const payload: Record<string, unknown> = {}
  if (preferences.theme !== undefined) payload.theme = preferences.theme
  if (preferences.currency !== undefined) payload.currency = preferences.currency
  if (preferences.profileVisibility !== undefined) {
    payload.profile_visibility = preferences.profileVisibility
  }
  if (preferences.emailNotifications !== undefined) {
    payload.email_notifications = preferences.emailNotifications
  }
  if (preferences.investmentAlerts !== undefined) {
    payload.investment_alerts = preferences.investmentAlerts
  }
  if (preferences.securityAlerts !== undefined) {
    payload.security_alerts = preferences.securityAlerts
  }

  const { error } = await upsertUserPreferences(userId, payload)
  if (error) {
    const message = (error as { message?: string }).message
    return { ok: false, error: String(message ?? error) }
  }
  return { ok: true }
}

export async function fetchWalletHealth(): Promise<WalletHealthData> {
  const userId = await requireUserId()
  if (!userId) return { score: 0, statusKey: 'actionRequired' }

  const [{ data: user }, { data: wallet }] = await Promise.all([
    getUser(userId),
    getWallet(userId),
  ])

  const kycVerified =
    Boolean(user?.is_verified) ||
    String(user?.kyc_status ?? '').toLowerCase() === 'verified' ||
    String(user?.verification_status ?? '').toLowerCase() === 'approved'
  const hasBalance = toNumber(wallet?.total_balance) > 0

  let score = 35
  if (kycVerified) score += 45
  if (hasBalance) score += 15
  score = Math.min(100, score)

  const statusKey: WalletHealthData['statusKey'] =
    score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'actionRequired'

  return { score, statusKey }
}

export async function fetchRewardTiers(): Promise<RewardTierItem[]> {
  const { data } = await getRewardsTiers()
  if (!data?.length) return []

  return data.map((row, index, arr) => {
    const min = Number(row.minimum_points ?? 0)
    const next = arr[index + 1]
    const maxLabel = next ? String(Number(next.minimum_points) - 1) : `${min}+`
    const benefits = String(row.benefits ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)

    return {
      tier: String(row.tier_name).replace(' Level', ''),
      points: `${min}-${maxLabel}`,
      benefits,
    }
  })
}

export async function fetchRewardCatalogItems(): Promise<RewardCatalogItem[]> {
  const { data } = await getRewardCatalog()
  if (!data?.length) return []

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? '',
    pointsCost: Number(row.points_cost ?? 0),
  }))
}

export async function fetchPortfolioPerformanceStats(period: PortfolioChartPeriod = '1Y') {
  const bundle = await fetchPortfolioChartsBundle(period)
  return bundle.performanceStats
}
