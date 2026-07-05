import {
  getFinancialKycAccess,
  type FinancialKycAccess,
} from '@/lib/investor/kyc-actions'
import {
  getCachedKycAccess,
  invalidateKycCache,
  setCachedKycAccess,
} from '@/lib/investor/kyc-client-cache'

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 800

const defaultAccess: FinancialKycAccess = {
  verified: false,
  status: 'pending',
  summary: null,
}

let inFlight: Promise<FinancialKycAccess> | null = null

async function fetchKycWithRetry(forceRefresh = false): Promise<FinancialKycAccess> {
  if (!forceRefresh) {
    const cached = getCachedKycAccess()
    if (cached?.verified) {
      console.log('KYC Status:', cached.status)
      return cached
    }
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await getFinancialKycAccess()
      console.log('KYC Status:', result.status)

      if (result.verified) {
        setCachedKycAccess(result)
      }

      return result
    } catch (err) {
      lastError = err
      console.error(`[KYC] Fetch attempt ${attempt}/${MAX_RETRIES} failed:`, err)

      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      }
    }
  }

  console.error('[KYC] All fetch attempts failed:', lastError)
  return { ...defaultAccess, fetchError: true }
}

export function fetchFinancialKycAccess(forceRefresh = false): Promise<FinancialKycAccess> {
  if (!forceRefresh) {
    const cached = getCachedKycAccess()
    if (cached?.verified) {
      return Promise.resolve(cached)
    }

    if (inFlight) {
      return inFlight
    }
  }

  const request = fetchKycWithRetry(forceRefresh).finally(() => {
    if (inFlight === request) {
      inFlight = null
    }
  })

  if (!forceRefresh) {
    inFlight = request
  }

  return request
}

export function refreshFinancialKycAccess(): Promise<FinancialKycAccess> {
  invalidateKycCache()
  return fetchFinancialKycAccess(true)
}
