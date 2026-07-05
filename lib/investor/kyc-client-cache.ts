import type { FinancialKycAccess } from '@/lib/investor/kyc-actions'

const CACHE_TTL_MS = 45_000

let cache: { data: FinancialKycAccess; fetchedAt: number } | null = null

export function getCachedKycAccess(): FinancialKycAccess | null {
  if (!cache) return null
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    cache = null
    return null
  }
  return cache.data
}

export function setCachedKycAccess(data: FinancialKycAccess) {
  cache = { data, fetchedAt: Date.now() }
}

export function invalidateKycCache() {
  cache = null
}
