import { loadInvestmentPlans } from '@/lib/invest/plan-actions'
import type { InvestmentPlan } from '@/lib/data/types'
import {
  getStaleAsyncCacheEntry,
  loadWithStaleWhileRevalidate,
} from '@/lib/hooks/async-cache'

/** Shared cache key — invest page, dashboard carousel, sidebar upgrade card. */
export const INVESTMENT_PLANS_CACHE_KEY = 'investment-plans'

/** Data is served from cache without revalidation. */
export const INVESTMENT_PLANS_FRESH_MS = 60_000

/** Stale data may be shown while a background refresh runs. */
export const INVESTMENT_PLANS_STALE_MS = 10 * 60_000

export const INVESTMENT_PLANS_REQUEST_TIMEOUT_MS = 1_000

export function readCachedInvestmentPlans(): InvestmentPlan[] | undefined {
  if (typeof window === 'undefined') return undefined
  return getStaleAsyncCacheEntry<InvestmentPlan[]>(
    INVESTMENT_PLANS_CACHE_KEY,
    INVESTMENT_PLANS_STALE_MS
  )
}

export function loadInvestmentPlansCached(
  onUpdated?: (plans: InvestmentPlan[]) => void
): Promise<InvestmentPlan[]> {
  return loadWithStaleWhileRevalidate(
    INVESTMENT_PLANS_CACHE_KEY,
    loadInvestmentPlans,
    INVESTMENT_PLANS_FRESH_MS,
    INVESTMENT_PLANS_STALE_MS,
    onUpdated
  )
}

/** Warm the cache after authentication — no-op if already fresh. */
export function prefetchInvestmentPlans(): void {
  if (typeof window === 'undefined') return
  const cached = readCachedInvestmentPlans()
  if (cached?.length) {
    void loadInvestmentPlansCached()
    return
  }
  void loadInvestmentPlansCached()
}
