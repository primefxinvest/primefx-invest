import { formatCurrency, toNumber } from '@/lib/data/format'
import type { InvestmentPlan } from '@/lib/data/types'

export const PLAN_UI_META: Record<
  string,
  {
    badge: string
    targetInvestor: string
    displayWeeklyRoi: string
    popular?: boolean
    assetClass: string
    color: string
  }
> = {
  'Starter Plan': {
    badge: 'FOR BEGINNERS',
    targetInvestor: 'New Investors',
    displayWeeklyRoi: '3%',
    assetClass: 'Forex',
    color: '#0052ff',
  },
  'Growth Plan': {
    badge: 'GROW YOUR WEALTH',
    targetInvestor: 'Growing Investors',
    displayWeeklyRoi: '3.5%',
    assetClass: 'Crypto',
    color: '#8b5cf6',
  },
  'Prime Plan': {
    badge: 'BEST VALUE',
    targetInvestor: 'Serious Investors',
    displayWeeklyRoi: '4%',
    popular: true,
    assetClass: 'Stocks',
    color: '#8b5cf6',
  },
  'Elite Plan': {
    badge: 'PREMIUM ACCESS',
    targetInvestor: 'Professional Investors',
    displayWeeklyRoi: '5%',
    assetClass: 'Commodities',
    color: '#f97316',
  },
}

export type DbInvestmentPlanRow = {
  id: string
  name: string
  weekly_roi?: number | string | null
  risk_level?: string | null
  minimum_investment?: number | string | null
  duration?: string | null
  payout_frequency?: string | null
  investor_count?: number | string | null
}

export function formatPlanPayoutLabel(_frequency?: string | null): string {
  return 'Weekly Payout'
}

export function mapDbPlansToInvestmentPlans(rows: DbInvestmentPlanRow[]): InvestmentPlan[] {
  return rows.map((plan) => {
    const meta = PLAN_UI_META[plan.name] ?? {
      badge: 'INVESTMENT PLAN',
      targetInvestor: 'All Investors',
      displayWeeklyRoi: `${toNumber(plan.weekly_roi)}%`,
      assetClass: 'Mixed',
      color: '#0052ff',
    }
    const minAmount = toNumber(plan.minimum_investment)

    return {
      id: plan.id,
      name: plan.name,
      weeklyRoi: meta.displayWeeklyRoi,
      weeklyRoiLabel: 'Weekly Return',
      category: meta.badge,
      targetInvestor: meta.targetInvestor,
      minInvestment: formatCurrency(minAmount),
      minAmount,
      duration: plan.duration === 'Flexible' ? 'No Lock Period' : (plan.duration ?? 'Flexible'),
      payout: formatPlanPayoutLabel(plan.payout_frequency),
      capitalAccess: 'Withdraw Anytime',
      investors: `${toNumber(plan.investor_count).toLocaleString()}+`,
      badge: meta.badge,
      popular: meta.popular,
    }
  })
}

export function formatPlanDisplayName(name: string) {
  return name.replace(/\s+Plan$/i, '')
}

export function getPlanCategoryColorClass(planName: string): string {
  const key = planName.toLowerCase()
  if (key.includes('starter')) return 'bg-emerald-50 text-emerald-700'
  if (key.includes('growth')) return 'bg-blue-50 text-blue-700'
  if (key.includes('prime')) return 'bg-purple-50 text-purple-700'
  if (key.includes('elite')) return 'bg-orange-50 text-orange-700'
  return 'bg-gray-50 text-gray-700'
}
