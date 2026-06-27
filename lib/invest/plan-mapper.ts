import { formatCurrency, toNumber } from '@/lib/data/format'
import type { InvestmentPlan } from '@/lib/data/types'

export const PLAN_UI_META: Record<
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
    badge: 'BEST VALUE',
    roiRange: '25% - 40%',
    popular: true,
    assetClass: 'Stocks',
    color: '#8b5cf6',
  },
  'Elite Plan': {
    badge: 'PREMIUM ACCESS',
    roiRange: '40% - 60%',
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

export function mapDbPlansToInvestmentPlans(rows: DbInvestmentPlanRow[]): InvestmentPlan[] {
  return rows.map((plan) => {
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
      weeklyRoiLabel: 'Target Weekly Return',
      roiRange: meta.roiRange,
      monthlyRoi: 'Monthly ROI',
      riskLevel: plan.risk_level ?? 'Medium',
      minInvestment: formatCurrency(minAmount),
      minAmount,
      duration: plan.duration === 'Flexible' ? 'No Lock Period' : (plan.duration ?? 'Flexible'),
      payout:
        plan.payout_frequency === 'Every 7 Days'
          ? 'Weekly Distribution'
          : (plan.payout_frequency ?? 'Weekly Distribution'),
      capitalAccess: 'Withdraw Anytime',
      investors: `${toNumber(plan.investor_count).toLocaleString()}+`,
      badge: meta.badge,
      popular: meta.popular,
    }
  })
}

export function formatPlanRiskLabel(riskLevel: string) {
  const value = riskLevel.trim()
  if (!value) return 'Medium Risk'
  if (/risk$/i.test(value)) return value
  return `${value} Risk`
}

export function formatPlanDisplayName(name: string) {
  return name.replace(/\s+Plan$/i, '')
}
