export interface InvestmentPlan {
  id: string
  name: string
  weeklyRoi: string
  weeklyRoiLabel: string
  roiRange: string
  monthlyRoi: string
  riskLevel: string
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

export interface WalletData {
  primeFxId?: string
  availableBalance: string
  pendingBalance: string
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
