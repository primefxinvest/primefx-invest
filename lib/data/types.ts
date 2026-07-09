import type { InvestmentDbRow, TransactionDbRow } from '@/lib/data/db-rows'

export interface InvestmentPlan {
  id: string
  name: string
  weeklyRoi: string
  weeklyRoiLabel: string
  category: string
  targetInvestor: string
  minInvestment: string
  minAmount: number
  duration: string
  payout: string
  capitalAccess: string
  investors: string
  badge: string
  popular?: boolean
}

export interface PortfolioMetrics {
  totalInvested: string
  currentValue: string
  totalProfit: string
  roiPercentage: string
  trends: { percentage: string; label: string }[]
}

export interface InvestmentSummaryStats {
  activeCount: number
  completedCount?: number
  totalWeeklyEarnings: string
  totalDailyEarnings?: string
  totalMonthlyEarnings?: string
  totalProfitsEarned: string
  totalWithdrawn?: string
  lifetimeRoi?: string
  averageRoi?: string
}

export interface InvestmentProfitHistoryItem {
  id: string
  periodDate: string
  amountUsd: number
  dailyRate: number
  principalUsd: number
  createdAt: string
}

export interface InvestmentDetailData {
  id: string
  displayId: string
  referenceId: string | null
  plan: string
  category: string
  investedAmount: number
  currentValue: number
  weeklyReturnPercent: number
  weeklyReturn: string
  dailyReturnPercent: number
  dailyReturn: string
  dailyProfit: number
  accumulatedProfit: number
  totalEarned: number
  roiPercent: number
  roi: string
  status: string
  createdAt: string
  createdAtIso: string
  nextPayoutAt: string | null
  nextPayoutLabel: string
  withdrawalUnlockAt: string | null
  capitalLockDays: number
  isCapitalUnlocked: boolean
  lockProgressPercent: number
  lockDaysRemaining: number
  lockCountdown: string
  compoundMode: boolean
  profitHistory: InvestmentProfitHistoryItem[]
}

export interface PortfolioInvestmentWithdrawalItem {
  id: string
  amountUsd: number
  status: string
  requestedAt: string
  availableAt: string
  referenceId: string | null
}

export interface PortfolioInvestmentItem {
  id: string
  displayId: string
  referenceId: string | null
  plan: string
  category: string
  categoryColor: string
  iconBg: string
  invested: string
  investedAmount: number
  currentValue: string
  currentValueAmount: number
  weeklyReturn: string
  weeklyReturnPercent: number
  dailyReturn: string
  dailyReturnPercent: number
  createdAt: string
  createdAtIso: string
  nextPayoutDate: string
  nextPayoutAt: string | null
  accumulatedProfit: string
  accumulatedProfitAmount: number
  roi: string
  roiPercent: number
  status: string
  withdrawalUnlockAt: string | null
  capitalLockDays: number
  isCapitalUnlocked: boolean
  lockProgressPercent: number
  lockDaysRemaining: number
  lockCountdown: string
  withdrawalHistory: PortfolioInvestmentWithdrawalItem[]
}

/** Raw + derived dashboard payload from a single data fetch. */
export interface DashboardCoreData {
  metrics: PortfolioMetrics
  investmentStats: InvestmentSummaryStats
  wallet: WalletData
  allocation: AssetAllocationItem[]
  investments: InvestmentDbRow[]
  portfolioCurrentValue: number
  transactions: TransactionDbRow[]
}

export interface ChartPoint {
  month: string
  value: number
}

export interface AssetAllocationItem {
  name: string
  value: number
  color: string
  amount?: string
}

export interface TransactionItem {
  id: string
  type: string
  description?: string
  amount: string
  amountValue: number
  isCredit: boolean
  date: string
  time?: string
  status: string
  referenceId?: string
  createdAt?: string
}

export interface CapitalWithdrawalRequestItem {
  id: string
  investmentId: string
  amountUsd: number
  status: string
  requestedAt: string
  availableAt: string
  referenceId: string | null
}

export interface WalletWithdrawalRequestItem {
  id: string
  amountUsd: number
  feeUsd: number
  netAmountUsd: number
  networkFeeUsd: number
  methodLabel: string
  status: string
  displayStatus: string
  requestedAt: string
  availableAt: string
  referenceId: string | null
  processedAt: string | null
  holdRemaining: string
  currency: string | null
  payoutAddress: string | null
  networkLabel: string
  provider: string | null
  transactionHash: string | null
  explorerUrl: string | null
  paymentStatus: string | null
  confirmations: number | null
  estimatedCompletion: string
  metadata: Record<string, unknown>
}

export interface WalletData {
  userId?: string
  primeFxId?: string
  availableBalance: string
  pendingBalance: string
  reservedBalance: string
  withdrawableBalance: string
  bonusBalance: string
  totalBalance: string
  balanceBreakdown: { label: string; value: number; percentage: number; color: string }[]
}

export interface MarketItem {
  id: string
  symbol: string
  price: string
  change: string
  trend: 'up' | 'down'
  icon: string
}

export interface RewardsData {
  currentTier: string
  nextTier: string
  points: string
  totalPoints: number
  nextLevel: string
  progress: number
}

export interface RewardAchievement {
  id: string
  name: string
  description: string
  points: number
  earned: boolean
  earnedDate?: string
  progress?: number
  progressMax?: number
}

export interface ReferralData {
  referralLink: string
  referralCode: string
  totalReferrals: number
  totalEarnings: string
}

export interface LearningProgress {
  completed: number
  total: number
  coursesCompleted: number
  label: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'payout' | 'market' | 'reward' | 'wallet' | 'security' | 'investment' | 'general'
  createdAt?: string
}

export interface PaymentMethod {
  id: string
  type: 'bank' | 'crypto' | 'card'
  label: string
  detail: string
  badge: 'Primary' | 'Active'
}

export interface WalletActivitySummary {
  period: string
  deposits: { value: string; change: string; trend: 'up' | 'down' }
  withdrawals: { value: string; change: string; trend: 'up' | 'down' }
  transfers: { value: string; change: string; trend: 'up' | 'down' }
  bonuses: { value: string; change: string; trend: 'up' | 'down' }
}

export interface AcademyCourseItem {
  id: string
  title: string
  description: string
  category: string
  lessons: number
  duration: string
  difficulty: string
  instructor: string
  progress: number
  completed: boolean
  locked: boolean
  lockReason?: string
}

export interface AcademyLessonItem {
  id: string
  title: string
  description: string
  content: string
  contentType: string
  sortOrder: number
  durationMinutes: number
  completed: boolean
}

export interface AcademyCourseDetail extends AcademyCourseItem {
  enrolled: boolean
  enrolledAt?: string
  completedAt?: string
  lessonsList: AcademyLessonItem[]
}

export interface AcademyStats {
  coursesCompleted: number
  totalCourses: number
  xpEarned: number
  learningStreakDays: number
}

export interface CommunityPostItem {
  id: string
  author: string
  avatar: string
  title: string
  content: string
  category: string
  likes: number
  comments: number
  timestamp: string
}

export interface CommunityMemberItem {
  id: string
  name: string
  posts: number
  engagement: number
  avatar: string
}

export interface SupportTicketItem {
  id: string
  ticketId: string
  subject: string
  description: string
  status: string
  priority: string
  created: string
  updated: string
  replyCount?: number
}

export interface SupportTicketMessage {
  id: string
  senderType: 'user' | 'admin'
  senderName: string
  message: string
  createdAt: string
}

export interface SupportTicketDetail extends SupportTicketItem {
  messages: SupportTicketMessage[]
}

export interface MarketInsightItem {
  id: string
  title: string
  summary: string
  tag: string
  sentiment: 'bullish' | 'neutral' | 'bearish'
}

export interface UserPreferencesData {
  theme: string
  currency: string
  profileVisibility: string
  emailNotifications: boolean
  investmentAlerts: boolean
  securityAlerts: boolean
}

export interface WalletHealthData {
  score: number
  statusKey: 'excellent' | 'good' | 'fair' | 'actionRequired'
}

export interface RewardTierItem {
  tier: string
  points: string
  benefits: string[]
}

export interface RewardCatalogItem {
  id: string
  name: string
  description: string
  pointsCost: number
}
