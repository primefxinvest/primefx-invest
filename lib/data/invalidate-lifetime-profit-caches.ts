import { invalidateAsyncCache } from '@/lib/hooks/async-cache'
import { CACHE_KEYS } from '@/lib/data/cache-keys'

/** Cache keys that embed lifetime profit KPIs — invalidate together on profit credits. */
export const LIFETIME_PROFIT_CACHE_KEYS = [
  CACHE_KEYS.dashboardCore,
  CACHE_KEYS.portfolioMetrics,
  CACHE_KEYS.portfolioOverview,
] as const

export function invalidateLifetimeProfitCaches() {
  for (const key of LIFETIME_PROFIT_CACHE_KEYS) {
    invalidateAsyncCache(key)
  }
}
