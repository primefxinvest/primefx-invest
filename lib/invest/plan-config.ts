import { Crown, Gem, Sprout, TrendingUp, type LucideIcon } from 'lucide-react'
import type { InvestmentPlan } from '@/lib/data/types'

export type { InvestmentPlan }

export interface PlanTheme {
  icon: LucideIcon
  card: string
  badge: string
  iconBg: string
  roiColor: string
  button: string
  riskColor: string
}

export const planThemes: Record<string, PlanTheme> = {
  '1': {
    icon: Sprout,
    card: 'border-emerald-200 bg-white hover:border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-600',
    roiColor: 'text-emerald-600',
    button: 'bg-emerald-500 text-white hover:bg-emerald-600',
    riskColor: 'text-emerald-600',
  },
  '2': {
    icon: TrendingUp,
    card: 'border-blue-200 bg-white hover:border-blue-300',
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100 text-[#0052ff]',
    roiColor: 'text-[#0052ff]',
    button: 'bg-[#0052ff] text-white hover:bg-blue-700',
    riskColor: 'text-blue-600',
  },
  '3': {
    icon: Crown,
    card: 'border-purple-300 bg-white ring-2 ring-purple-400/60 hover:border-purple-400',
    badge: 'bg-purple-600 text-white',
    iconBg: 'bg-purple-100 text-purple-600',
    roiColor: 'text-purple-600',
    button: 'bg-purple-600 text-white hover:bg-purple-700',
    riskColor: 'text-purple-600',
  },
  '4': {
    icon: Gem,
    card: 'border-orange-200 bg-white hover:border-orange-300',
    badge: 'bg-orange-100 text-orange-700',
    iconBg: 'bg-orange-100 text-orange-600',
    roiColor: 'text-orange-600',
    button: 'bg-orange-500 text-white hover:bg-orange-600',
    riskColor: 'text-orange-600',
  },
}

const planThemeByName: Record<string, keyof typeof planThemes> = {
  'Starter Plan': '1',
  'Growth Plan': '2',
  'Prime Plan': '3',
  'Elite Plan': '4',
}

export function getPlanTheme(plan: InvestmentPlan, index = 0): PlanTheme {
  const key = planThemeByName[plan.name] ?? (['1', '2', '3', '4'][index % 4] as keyof typeof planThemes)
  return planThemes[key] ?? planThemes['1']
}

export const trustFeatures = [
  { label: 'No Hidden Fees', icon: 'fees' },
  { label: 'Withdraw Anytime', icon: 'withdraw' },
  { label: 'Smart Diversification', icon: 'diversify' },
  { label: 'AI Risk Management', icon: 'ai' },
] as const

export const whyInvestItems = [
  'Licensed & Regulated',
  'Advanced AI Trading',
  'Real-time Market Intelligence',
  'Institutional-Grade Security',
  '24/7 Multilingual Support',
] as const

export const howItWorksSteps = [
  { number: '1', title: 'Create Account', description: 'Sign up and verify your identity' },
  { number: '2', title: 'Choose Your Plan', description: 'Select a plan that matches your goals' },
  { number: '3', title: 'Fund Your Account', description: 'Add funds to your wallet' },
  { number: '4', title: 'We Invest For You', description: 'Our AI handles the investing' },
  { number: '5', title: 'Grow & Withdraw', description: 'Watch your wealth grow and withdraw anytime' },
] as const
