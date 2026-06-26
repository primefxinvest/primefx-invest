// Mock data for PrimeFx Invest
export const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  tier: 'Elite Investor',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  joinedDate: '2023-01-15',
}

export const investmentPlans = [
  {
    id: '1',
    name: 'Starter Plan',
    weeklyRoi: '3%',
    roiRange: '8% - 15%',
    monthlyRoi: 'Monthly ROI',
    riskLevel: 'Low',
    minInvestment: '$50',
    duration: 'Flexible',
    payout: 'Every 7 Days',
    capitalAccess: 'Anytime',
    investors: '1,245+',
    badge: 'FOR BEGINNERS',
  },
  {
    id: '2',
    name: 'Growth Plan',
    weeklyRoi: '3.8%',
    roiRange: '15% - 25%',
    monthlyRoi: 'Monthly ROI',
    riskLevel: 'Medium',
    minInvestment: '$200',
    duration: 'Flexible',
    payout: 'Every 7 Days',
    capitalAccess: 'Anytime',
    investors: '2,341+',
    badge: 'GROW YOUR WEALTH',
  },
  {
    id: '3',
    name: 'Prime Plan',
    weeklyRoi: '4.2%',
    roiRange: '25% - 40%',
    monthlyRoi: 'Monthly ROI',
    riskLevel: 'Medium-High',
    minInvestment: '$500',
    duration: 'Flexible',
    payout: 'Every 7 Days',
    capitalAccess: 'Anytime',
    investors: '4,789+',
    badge: 'MOST POPULAR',
    popular: true,
  },
  {
    id: '4',
    name: 'Elite Plan',
    weeklyRoi: '5%',
    roiRange: '40% - 60%',
    monthlyRoi: 'Monthly ROI',
    riskLevel: 'Very High',
    minInvestment: '$1,000',
    duration: 'Flexible',
    payout: 'Every 7 Days',
    capitalAccess: 'Anytime',
    investors: '1,026+',
    badge: 'PREMIUM PLAN',
  },
]

export const portfolioData = {
  totalInvested: '$85,750.00',
  currentValue: '$125,890.75',
  totalProfit: '$40,140.75',
  roiPercentage: '+46.82%',
  trends: [
    { percentage: '+11.23%', label: 'from last month' },
    { percentage: '+15.68%', label: 'from last month' },
    { percentage: '+18.75%', label: 'from last month' },
    { percentage: '+3.25%', label: 'from last month' },
  ],
}

export const chartData = [
  { month: 'Jan', value: 25000 },
  { month: 'Feb', value: 32000 },
  { month: 'Mar', value: 38000 },
  { month: 'Apr', value: 42000 },
  { month: 'May', value: 55000 },
  { month: 'Jun', value: 62000 },
  { month: 'Jul', value: 70000 },
  { month: 'Aug', value: 78000 },
  { month: 'Sep', value: 85000 },
  { month: 'Oct', value: 95000 },
  { month: 'Nov', value: 110000 },
  { month: 'Dec', value: 125890 },
]

export const assetAllocation = [
  { name: 'Forex', value: 40, color: '#0052ff' },
  { name: 'Crypto', value: 30, color: '#8b5cf6' },
  { name: 'Stocks', value: 20, color: '#10b981' },
  { name: 'Commodities', value: 10, color: '#f97316' },
]

export const recentTransactions = [
  {
    id: '1',
    type: 'Deposit',
    description: 'Bank Transfer',
    amount: '+$1,000.00',
    date: 'May 10, 2024 09:30 AM',
    status: 'Completed',
    icon: 'Download',
  },
  {
    id: '2',
    type: 'Profit',
    description: 'Investment Returns',
    amount: '+$125.50',
    date: 'May 10, 2024 12:45 PM',
    status: 'Completed',
    icon: 'TrendingUp',
  },
  {
    id: '3',
    type: 'Withdraw',
    description: 'Bank Transfer',
    amount: '-$500.00',
    date: 'May 09, 2024 04:20 PM',
    status: 'Completed',
    icon: 'Upload',
  },
  {
    id: '4',
    type: 'Bonus',
    description: 'Referral Bonus',
    amount: '+$50.00',
    date: 'May 08, 2024 11:15 AM',
    status: 'Completed',
    icon: 'Gift',
  },
]

export const walletData = {
  availableBalance: '$6,842.50',
  pendingBalance: '$1,250.00',
  bonusBalance: '$320.75',
  totalBalance: '$8,413.25',
  balanceBreakdown: [
    { label: 'Available Balance', value: 6842.50, percentage: 81.3 },
    { label: 'Pending Balance', value: 1250.0, percentage: 14.9 },
    { label: 'Bonus Balance', value: 320.75, percentage: 3.8 },
  ],
}

export const activeInvestments = [
  {
    id: '1',
    plan: 'Starter Plan',
    invested: '$500.00',
    currentValue: '$620.00',
    roi: '+24.00%',
    status: 'Active',
  },
  {
    id: '2',
    plan: 'Growth Plan',
    invested: '$2,000.00',
    currentValue: '$2,450.00',
    roi: '+22.50%',
    status: 'Active',
  },
  {
    id: '3',
    plan: 'Prime Plan',
    invested: '$5,000.00',
    currentValue: '$5,700.00',
    roi: '+34.00%',
    status: 'Active',
  },
  {
    id: '4',
    plan: 'Elite Plan',
    invested: '$7,000.00',
    currentValue: '$8,732.45',
    roi: '+24.75%',
    status: 'Active',
  },
]

export const completedInvestments = [
  {
    id: '1',
    plan: 'Starter Plan',
    invested: '$300.00',
    finalValue: '$390.00',
    profit: '+$90.00',
    date: 'Apr 15, 2024',
  },
  {
    id: '2',
    plan: 'Growth Plan',
    invested: '$1,000.00',
    finalValue: '$1,280.00',
    profit: '-$280.00',
    date: 'Mar 10, 2024',
  },
  {
    id: '3',
    plan: 'Prime Plan',
    invested: '$2,000.00',
    finalValue: '$2,640.00',
    profit: '+$640.00',
    date: 'Feb 28, 2024',
  },
]

export const marketOverview = [
  {
    id: '1',
    symbol: 'BTC/USD',
    price: '$67,890.45',
    change: '+2.53%',
    trend: 'up',
    icon: '₿',
  },
  {
    id: '2',
    symbol: 'ETH/USD',
    price: '$3,560.22',
    change: '+1.85%',
    trend: 'up',
    icon: 'Ξ',
  },
  {
    id: '3',
    symbol: 'GOLD',
    price: '$2,345.60',
    change: '+0.81%',
    trend: 'up',
    icon: '◆',
  },
  {
    id: '4',
    symbol: 'EUR/USD',
    price: '1.0887',
    change: '-0.15%',
    trend: 'down',
    icon: '€',
  },
]

export const quickActions = [
  { id: '1', label: 'Invest Now', description: 'Start investing', icon: 'TrendingUp' },
  { id: '2', label: 'Deposit', description: 'Add funds', icon: 'Download' },
  { id: '3', label: 'Withdraw', description: 'Request payout', icon: 'Upload' },
  { id: '4', label: 'Transfer', description: 'Send money', icon: 'Send' },
  { id: '5', label: 'PrimeAI', description: 'Ask anything', icon: 'Zap' },
  { id: '6', label: 'Academy', description: 'Learn & grow', icon: 'BookOpen' },
]

export const rewardsData = {
  currentTier: 'Gold Level',
  nextTier: 'Platinum Level',
  points: '2,450 / 5,000 XP',
  nextLevel: 'Next: Platinum Level',
}

export const referralData = {
  referralLink: 'https://primefx.invest/ref/john2024',
  totalReferrals: 128,
  totalEarnings: '$2,850.75',
}

export const learningProgress = {
  completed: 75,
  total: 100,
  coursesCompleted: 12,
  label: 'Courses Completed',
}

export const securityStatus = {
  status: 'Very Strong',
  score: 92,
  label: 'Your account is well protected',
}
