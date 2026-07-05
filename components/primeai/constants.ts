import {
  BarChart3,
  Bell,
  Compass,
  Crown,
  GitCompare,
  LineChart,
  Network,
  PieChart,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export const PRIMEAI_CAPABILITIES = [
  { key: 'portfolioAnalysis', icon: PieChart },
  { key: 'marketIntelligence', icon: LineChart },
  { key: 'investmentGuidance', icon: Compass },
  { key: 'riskAnalysis', icon: Shield },
  { key: 'smartAlerts', icon: Bell },
  { key: 'strategyAssistant', icon: Sparkles },
] as const

export type QuickActionKey =
  | 'analyzePortfolio'
  | 'bestPlan'
  | 'marketOpportunities'
  | 'riskAnalysis'
  | 'diversification'
  | 'profitForecast'
  | 'comparePlans'
  | 'investmentStrategy'

export const PRIMEAI_QUICK_ACTIONS: Array<{
  key: QuickActionKey
  icon: LucideIcon
  query: string
}> = [
  {
    key: 'analyzePortfolio',
    icon: PieChart,
    query: 'Analyze my portfolio performance and give me actionable insights.',
  },
  {
    key: 'bestPlan',
    icon: Crown,
    query: 'What is the best investment plan for my goals and risk profile?',
  },
  {
    key: 'marketOpportunities',
    icon: TrendingUp,
    query: 'What market opportunities should I consider today?',
  },
  {
    key: 'riskAnalysis',
    icon: Shield,
    query: 'Evaluate my portfolio risk and exposure.',
  },
  {
    key: 'diversification',
    icon: Network,
    query: 'How can I diversify my investments to reduce risk?',
  },
  {
    key: 'profitForecast',
    icon: BarChart3,
    query: 'Forecast potential returns based on my current investment plan.',
  },
  {
    key: 'comparePlans',
    icon: GitCompare,
    query: 'Compare available investment plans side by side.',
  },
  {
    key: 'investmentStrategy',
    icon: Target,
    query: 'Recommend an investment strategy tailored to my profile.',
  },
]
