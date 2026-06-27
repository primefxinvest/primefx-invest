import { Crown, Gem, Sprout, TrendingUp, type LucideIcon } from 'lucide-react'
import type { InvestmentPlan } from '@/lib/data/types'

export type { InvestmentPlan }

export interface PlanTheme {
  icon: LucideIcon
  card: string
  badge: string
  iconBg: string
  illustration: string
  roiColor: string
  button: string
  riskColor: string
  checkColor: string
  avatarColors: string[]
  primeAiScore: number
  features: string[]
}

export const planThemes: Record<string, PlanTheme> = {
  '1': {
    icon: Sprout,
    card: 'border-emerald-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-md',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    iconBg: 'bg-emerald-100 text-emerald-600',
    illustration: 'from-emerald-50 via-white to-emerald-100/80',
    roiColor: 'text-emerald-600',
    button: 'bg-emerald-500 text-white hover:bg-emerald-600',
    riskColor: 'text-emerald-600',
    checkColor: 'text-emerald-500',
    avatarColors: ['bg-emerald-400', 'bg-teal-400', 'bg-green-500'],
    primeAiScore: 88,
    features: [
      'Weekly Profit Distribution',
      'Flexible Exit',
      'PrimeAI Monitoring',
      '24/7 Support',
      'Portfolio Insights',
    ],
  },
  '2': {
    icon: TrendingUp,
    card: 'border-blue-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
    iconBg: 'bg-blue-100 text-[#0052ff]',
    illustration: 'from-blue-50 via-white to-blue-100/80',
    roiColor: 'text-[#0052ff]',
    button: 'bg-[#0052ff] text-white hover:bg-blue-700',
    riskColor: 'text-blue-600',
    checkColor: 'text-blue-500',
    avatarColors: ['bg-blue-400', 'bg-indigo-400', 'bg-sky-500'],
    primeAiScore: 90,
    features: [
      'Weekly Profit Distribution',
      'Flexible Exit',
      'PrimeAI Monitoring',
      '24/7 Support',
      'Portfolio Analytics',
    ],
  },
  '3': {
    icon: Crown,
    card: 'border-purple-300 bg-white shadow-md ring-1 ring-purple-200 hover:border-purple-400 hover:shadow-lg',
    badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-100',
    iconBg: 'bg-purple-100 text-purple-600',
    illustration: 'from-purple-50 via-white to-purple-100/80',
    roiColor: 'text-purple-600',
    button: 'bg-purple-600 text-white hover:bg-purple-700',
    riskColor: 'text-purple-600',
    checkColor: 'text-purple-500',
    avatarColors: ['bg-purple-400', 'bg-violet-400', 'bg-fuchsia-500'],
    primeAiScore: 94,
    features: [
      'Weekly Profit Distribution',
      'Flexible Exit',
      'PrimeAI Monitoring',
      '24/7 Support',
      'Advanced Analytics',
      'Dedicated Manager',
    ],
  },
  '4': {
    icon: Gem,
    card: 'border-orange-100 bg-white shadow-sm hover:border-orange-200 hover:shadow-md',
    badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
    iconBg: 'bg-orange-100 text-orange-600',
    illustration: 'from-orange-50 via-white to-amber-100/80',
    roiColor: 'text-orange-600',
    button: 'bg-orange-500 text-white hover:bg-orange-600',
    riskColor: 'text-orange-600',
    checkColor: 'text-orange-500',
    avatarColors: ['bg-orange-400', 'bg-amber-400', 'bg-yellow-500'],
    primeAiScore: 98,
    features: [
      'Weekly Profit Distribution',
      'Flexible Exit',
      'PrimeAI Monitoring',
      '24/7 Support',
      'VIP Support',
      'Exclusive Opportunities',
    ],
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

export interface LandingPlanTheme {
  icon: LucideIcon
  card: string
  iconBg: string
  riskColor: string
  buttonClass: string
}

const landingPlanThemes: Record<keyof typeof planThemes, Omit<LandingPlanTheme, 'icon'>> = {
  '1': {
    card: 'border-emerald-200 bg-emerald-50/50',
    iconBg: 'bg-emerald-100 text-emerald-600',
    riskColor: 'bg-emerald-100 text-emerald-700',
    buttonClass: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  },
  '2': {
    card: 'border-blue-200 bg-blue-50/50',
    iconBg: 'bg-blue-100 text-[#0052ff]',
    riskColor: 'bg-blue-100 text-blue-700',
    buttonClass: 'border-[#0052ff] text-[#0052ff] hover:bg-blue-50',
  },
  '3': {
    card: 'border-purple-300 bg-purple-50/50 ring-2 ring-purple-400',
    iconBg: 'bg-purple-100 text-purple-600',
    riskColor: 'bg-purple-100 text-purple-700',
    buttonClass: 'border-purple-500 text-purple-600 hover:bg-purple-50',
  },
  '4': {
    card: 'border-orange-200 bg-orange-50/50',
    iconBg: 'bg-orange-100 text-orange-600',
    riskColor: 'bg-orange-100 text-orange-700',
    buttonClass: 'border-orange-500 text-orange-600 hover:bg-orange-50',
  },
}

export function getLandingPlanTheme(plan: InvestmentPlan, index = 0): LandingPlanTheme {
  const key = planThemeByName[plan.name] ?? (['1', '2', '3', '4'][index % 4] as keyof typeof planThemes)
  const base = planThemes[key] ?? planThemes['1']
  const landing = landingPlanThemes[key] ?? landingPlanThemes['1']

  return {
    icon: base.icon,
    ...landing,
  }
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
