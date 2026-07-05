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
}> = [
  { key: 'analyzePortfolio', icon: PieChart },
  { key: 'bestPlan', icon: Crown },
  { key: 'marketOpportunities', icon: TrendingUp },
  { key: 'riskAnalysis', icon: Shield },
  { key: 'diversification', icon: Network },
  { key: 'profitForecast', icon: BarChart3 },
  { key: 'comparePlans', icon: GitCompare },
  { key: 'investmentStrategy', icon: Target },
]
