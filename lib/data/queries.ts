import { getCurrentUser } from '@/lib/supabase'
import {
  getInvestmentPlans,
  getPaymentMethods,
  getReferrals,
  getUser,
  getUserCourses,
  getUserInvestments,
  getUserPortfolio,
  getUserTransactions,
  getWallet,
  getMarketAssets,
} from '@/lib/db/supabase'
import { formatCurrency, formatDate, formatDateTime, formatPercent, formatRelativeTime, toNumber } from '@/lib/data/format'
import type {
  AssetAllocationItem,
  ChartPoint,
  InvestmentPlan,
  LearningProgress,
  MarketItem,
  NotificationItem,
  PaymentMethod,
  PortfolioMetrics,
  ReferralData,
  RewardAchievement,
  RewardsData,
  TransactionItem,
  WalletActivitySummary,
  WalletData,
} from '@/lib/data/types'

const PLAN_UI_META: Record<
  string,
  { badge: string; roiRange: string; popular?: boolean; assetClass: string; color: string }
> = {
  'Starter Plan': {
    badge: 'FOR BEGINNERS',
    roiRange: '8% - 15%',
    assetClass: 'Forex',
    color: '#0052ff',
  },
  'Growth Plan': {
    badge: 'GROW YOUR WEALTH',
    roiRange: '15% - 25%',
    assetClass: 'Crypto',
    color: '#8b5cf6',
  },
  'Prime Plan': {
    badge: 'MOST POPULAR',
    roiRange: '25% - 40%',
    popular: true,
    assetClass: 'Stocks',
    color: '#10b981',
  },
  'Elite Plan': {
    badge: 'PREMIUM PLAN',
    roiRange: '40% - 60%',
    assetClass: 'Commodities',
    color: '#f97316',
  },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

async function requireUserId() {
  const { data: user } = await getCurrentUser()
  return user?.id ?? null
}

export async function fetchInvestmentPlans(): Promise<InvestmentPlan[]> {
  const { data, error } = await getInvestmentPlans()

  if (error || !data?.length) {
    return []
  }

  return data.map((plan) => {
    const meta = PLAN_UI_META[plan.name] ?? {
      badge: 'INVESTMENT PLAN',
      roiRange: `${toNumber(plan.weekly_roi) * 4}%+`,
      assetClass: 'Mixed',
      color: '#0052ff',
    }
    const minAmount = toNumber(plan.minimum_investment)

    return {
      id: plan.id,
      name: plan.name,
      weeklyRoi: `${toNumber(plan.weekly_roi)}%`,
      weeklyRoiLabel: 'Weekly Return',
      roiRange: meta.roiRange,
      monthlyRoi: 'Monthly ROI',
      riskLevel: plan.risk_level,
      minInvestment: formatCurrency(minAmount),
      minAmount,
      duration: plan.duration ?? 'Flexible',
      payout: plan.payout_frequency ?? 'Every 7 Days',
      capitalAccess: 'Anytime',
      investors: `${toNumber(plan.investor_count).toLocaleString()}+`,
      badge: meta.badge,
      popular: meta.popular,
    }
  })
}

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const userId = await requireUserId()
  if (!userId) {
    return emptyPortfolioMetrics()
  }

  const { data: portfolio } = await getUserPortfolio(userId)
  const totalInvested = toNumber(portfolio?.total_invested)
  const currentValue = toNumber(portfolio?.current_value)
  const profit = toNumber(portfolio?.profit_loss)
  const roi = toNumber(portfolio?.roi_percentage)

  return {
    totalInvested: formatCurrency(totalInvested),
    currentValue: formatCurrency(currentValue),
    totalProfit: formatCurrency(profit, { signed: true }),
    roiPercentage: formatPercent(roi, { signed: true }),
    trends: [
      { percentage: formatPercent(roi * 0.24, { signed: true }), label: 'from last month' },
      { percentage: formatPercent(roi * 0.34, { signed: true }), label: 'from last month' },
      { percentage: formatPercent(roi * 0.4, { signed: true }), label: 'from last month' },
      { percentage: formatPercent(roi * 0.07, { signed: true }), label: 'from last month' },
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

export async function fetchPortfolioChart(): Promise<ChartPoint[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const [{ data: investments }, { data: portfolio }] = await Promise.all([
    getUserInvestments(userId),
    getUserPortfolio(userId),
  ])

  const currentValue = toNumber(portfolio?.current_value)
  const year = new Date().getFullYear()
  const monthly = new Map<number, number>()

  investments?.forEach((investment) => {
    const date = new Date(investment.created_at)
    if (date.getFullYear() !== year) return
    const month = date.getMonth()
    monthly.set(month, (monthly.get(month) ?? 0) + toNumber(investment.current_value ?? investment.amount))
  })

  if (monthly.size === 0) {
    return MONTHS.map((month, index) => ({
      month,
      value: Math.round((currentValue / 12) * (index + 1)),
    }))
  }

  let running = 0
  return MONTHS.map((month, index) => {
    running += monthly.get(index) ?? 0
    return { month, value: Math.round(running || currentValue * ((index + 1) / 12)) }
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

export async function fetchRecentTransactions(limit = 4): Promise<TransactionItem[]> {
  const userId = await requireUserId()
  if (!userId) return []

  const { data } = await getUserTransactions(userId)
  if (!data?.length) return []

  return data.slice(0, limit).map((tx) => {
    const amount = toNumber(tx.amount)
    const type = normalizeTransactionType(tx.type)
    return {
      id: tx.id,
      type,
      description: tx.description ?? type,
      amount: formatCurrency(amount, { signed: true }),
      date: formatDateTime(tx.created_at),
      status: capitalize(tx.status ?? 'Completed'),
      referenceId: tx.reference_id ?? undefined,
    }
  })
}

export async function fetchWalletData(): Promise<WalletData> {
  const userId = await requireUserId()
  if (!userId) return emptyWalletData()

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

  const { data } = await getUserTransactions(userId)
  if (!data?.length) return []

  return data.map((tx) => {
    const amount = toNumber(tx.amount)
    const type = normalizeTransactionType(tx.type)
    const created = new Date(tx.created_at)
    return {
      id: tx.id,
      type,
      description: tx.description ?? type,
      amount: formatCurrency(amount, { signed: true }),
      date: formatDate(tx.created_at),
      time: created.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      status: capitalize(tx.status ?? 'Pending') as TransactionItem['status'],
      referenceId: tx.reference_id ?? `TXN-${tx.id.slice(0, 8).toUpperCase()}`,
    }
  })
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

  const { data } = await getUserTransactions(userId)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const sums = { deposit: 0, withdrawal: 0, transfer: 0, bonus: 0 }

  data?.forEach((tx) => {
    const created = new Date(tx.created_at)
    if (created < monthStart) return
    const type = (tx.type ?? '').toLowerCase()
    const amount = Math.abs(toNumber(tx.amount))
    if (type.includes('deposit')) sums.deposit += amount
    else if (type.includes('withdraw')) sums.withdrawal += amount
    else if (type.includes('transfer')) sums.transfer += amount
    else if (type.includes('bonus') || type.includes('profit') || type.includes('referral')) sums.bonus += amount
  })

  const formatTrend = (value: number) => ({
    value: formatCurrency(value),
    change: value > 0 ? '+100%' : '0%',
    trend: 'up' as const,
  })

  return {
    period: 'This Month',
    deposits: formatTrend(sums.deposit),
    withdrawals: formatTrend(sums.withdrawal),
    transfers: formatTrend(sums.transfer),
    bonuses: formatTrend(sums.bonus),
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
    return { referralLink: '', totalReferrals: 0, totalEarnings: formatCurrency(0) }
  }

  const [{ data: user }, { data: referrals }] = await Promise.all([
    getUser(userId),
    getReferrals(userId),
  ])

  const totalEarnings =
    referrals?.reduce((sum, row) => sum + toNumber(row.bonus_earned), 0) ?? 0
  const slug = user?.full_name?.toLowerCase().replace(/\s+/g, '') || userId.slice(0, 8)

  return {
    referralLink: `${typeof window !== 'undefined' ? window.location.origin : 'https://primefx.invest'}/signup?ref=${slug}`,
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
  const tiers = [
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

  const { data } = await getUserTransactions(userId)
  if (!data?.length) return []

  return data.slice(0, 8).map((tx) => ({
    id: tx.id,
    title: notificationTitle(tx.type),
    message: tx.description ?? `Transaction ${tx.type}`,
    time: formatRelativeTime(tx.created_at),
    read: (tx.status ?? '').toLowerCase() !== 'pending',
    type: notificationType(tx.type),
  }))
}

function normalizeTransactionType(type?: string | null) {
  const value = (type ?? 'deposit').toLowerCase()
  if (value.includes('withdraw')) return 'Withdraw'
  if (value.includes('profit') || value.includes('investment')) return 'Profit'
  if (value.includes('bonus') || value.includes('referral')) return 'Bonus'
  if (value.includes('transfer')) return 'Transfer'
  return 'Deposit'
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function normalizePaymentType(type?: string | null): PaymentMethod['type'] {
  const value = (type ?? '').toLowerCase()
  if (value.includes('crypto') || value.includes('usdt') || value.includes('btc')) return 'crypto'
  if (value.includes('card')) return 'card'
  return 'bank'
}

function formatPaymentLabel(type?: string | null) {
  const value = (type ?? 'bank').toLowerCase()
  if (value.includes('usdt')) return 'USDT (TRC20)'
  if (value.includes('btc')) return 'Bitcoin (BTC)'
  if (value.includes('card')) return 'Credit Card'
  return 'Bank Account'
}

function notificationTitle(type?: string | null) {
  const value = (type ?? '').toLowerCase()
  if (value.includes('profit') || value.includes('investment')) return 'Investment payout received'
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
export async function fetchReferralList() {
  const userId = await requireUserId()
  if (!userId) return []

  const { data } = await getReferrals(userId)
  if (!data?.length) return []

  return data.map((row) => ({
    id: row.id as string,
    name: `Referral ${(row.referred_user_id as string).slice(0, 8)}`,
    email: 'Referred investor',
    status: (row.status as string) ?? 'Active',
    commissionEarned: toNumber(row.bonus_earned),
    joinedDate: formatDate(row.created_at as string),
    tradingVolume: formatCurrency(toNumber(row.bonus_earned) * 20),
  }))
}

export async function fetchPortfolioOverview() {
  const userId = await requireUserId()
  const metrics = await fetchPortfolioMetrics()
  const { data: investments } = userId ? await getUserInvestments(userId) : { data: [] }
  const activePlans = investments?.filter((i) => (i.status ?? '').toLowerCase() === 'active').length ?? 0

  return {
    totalInvested: metrics.totalInvested,
    currentValue: metrics.currentValue,
    profitLoss: metrics.totalProfit,
    roi: metrics.roiPercentage,
    activePlans,
  }
}

export async function fetchPortfolioInvestments() {
  const userId = await requireUserId()
  if (!userId) return { active: [], completed: [] }

  const { data } = await getUserInvestments(userId)
  if (!data?.length) return { active: [], completed: [] }

  const active = data
    .filter((i) => (i.status ?? '').toLowerCase() === 'active')
    .map(mapInvestmentRow)
  const completed = data
    .filter((i) => (i.status ?? '').toLowerCase() !== 'active')
    .map(mapCompletedInvestmentRow)

  return { active, completed }
}

function mapInvestmentRow(investment: Record<string, unknown>) {
  const plan = investment.investment_plans as { name?: string; risk_level?: string } | undefined
  const invested = toNumber(investment.amount as string | number | null | undefined)
  const current = toNumber(
    (investment.current_value ?? investment.amount) as string | number | null | undefined
  )
  const roi = invested > 0 ? ((current - invested) / invested) * 100 : 0

  return {
    id: investment.id as string,
    plan: plan?.name ?? 'Investment',
    risk: `${plan?.risk_level ?? 'Medium'} Risk`,
    riskColor: 'bg-blue-50 text-blue-700',
    iconBg: 'bg-blue-100 text-blue-600',
    invested: formatCurrency(invested),
    currentValue: formatCurrency(current),
    roi: formatPercent(roi, { signed: true }),
    status: capitalize((investment.status as string) ?? 'Active'),
  }
}

function mapCompletedInvestmentRow(investment: Record<string, unknown>) {
  const plan = investment.investment_plans as { name?: string } | undefined
  const invested = toNumber(investment.amount as string | number | null | undefined)
  const finalValue = toNumber(
    (investment.current_value ?? investment.amount) as string | number | null | undefined
  )
  const profit = finalValue - invested

  return {
    id: investment.id as string,
    plan: plan?.name ?? 'Investment',
    date: formatDate(investment.end_date as string ?? investment.created_at as string),
    invested: formatCurrency(invested),
    finalValue: formatCurrency(finalValue),
    profit: formatCurrency(profit, { signed: true }),
    status: 'Completed',
  }
}

export async function fetchMonthlyReturns(): Promise<ChartPoint[]> {
  const chart = await fetchPortfolioChart()
  return chart.map((point, index, arr) => {
    const prev = index > 0 ? arr[index - 1].value : point.value
    const change = prev > 0 ? ((point.value - prev) / prev) * 100 : 0
    return { month: point.month, value: Math.round(change * 10) / 10 }
  })
}
