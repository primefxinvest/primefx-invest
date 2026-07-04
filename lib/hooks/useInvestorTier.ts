'use client'

import { useSessionUser } from '@/lib/hooks/useSessionUser'
import {
  getInvestorTierConfig,
  normalizeInvestorTier,
  type InvestorTierKey,
} from '@/lib/investor/tiers'
import type { InvestorTierConfig } from '@/lib/investor/types'

export interface InvestorTierState {
  loading: boolean
  tierKey: InvestorTierKey
  tierLabel: string
  badge: string
  config: InvestorTierConfig
}

const defaultTier = getInvestorTierConfig('starter')

/** Derives investor tier from the shared session store — no duplicate users query. */
export function useInvestorTier(): InvestorTierState {
  const user = useSessionUser()

  if (!user.id) {
    return {
      loading: false,
      tierKey: 'starter',
      tierLabel: defaultTier.label,
      badge: defaultTier.badge,
      config: defaultTier,
    }
  }

  const tierKey = normalizeInvestorTier(user.tier)
  const config = getInvestorTierConfig(tierKey)

  return {
    loading: false,
    tierKey,
    tierLabel: config.label,
    badge: config.badge,
    config,
  }
}
