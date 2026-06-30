'use client'

import { Loader2 } from 'lucide-react'
import { useInvestorTier } from '@/lib/hooks/useInvestorTier'
import {
  canAccessFeature,
  canAccessRoute,
  getRouteRequiredTier,
  normalizeInvestorTier,
} from '@/lib/investor/tiers'
import type { InvestorFeature } from '@/lib/investor/types'
import { UpgradePrompt } from './UpgradePrompt'

interface InvestorPageGateProps {
  children: React.ReactNode
  feature?: InvestorFeature
  route?: string
}

export function InvestorPageGate({ children, feature, route }: InvestorPageGateProps) {
  const { loading, tierKey } = useInvestorTier()

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (feature && !canAccessFeature(tierKey, feature)) {
    const required =
      feature === 'market_insights'
        ? 'growth'
        : feature === 'portfolio_analysis' || feature === 'advanced_portfolio_analysis'
          ? 'prime'
          : 'growth'

    return (
      <UpgradePrompt currentTier={tierKey} requiredTier={required} feature={feature} />
    )
  }

  if (route) {
    const requiredTier = getRouteRequiredTier(route)
    if (requiredTier && !canAccessRoute(tierKey, route)) {
      return (
        <UpgradePrompt
          currentTier={tierKey}
          requiredTier={normalizeInvestorTier(requiredTier)}
          title={`${route.replace('/', '').replace('-', ' ')} requires ${requiredTier} tier`}
        />
      )
    }
  }

  return children
}
