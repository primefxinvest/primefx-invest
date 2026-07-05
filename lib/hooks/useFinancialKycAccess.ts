'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FinancialKycAccess } from '@/lib/investor/kyc-actions'
import { getCachedKycAccess } from '@/lib/investor/kyc-client-cache'
import {
  fetchFinancialKycAccess,
  refreshFinancialKycAccess,
} from '@/lib/investor/kyc-client-fetch'

const defaultAccess: FinancialKycAccess = {
  verified: false,
  status: 'pending',
  summary: null,
}

export function useFinancialKycAccess() {
  const cached = getCachedKycAccess()
  const [access, setAccess] = useState<FinancialKycAccess & { loading: boolean }>({
    ...(cached ?? defaultAccess),
    loading: !cached,
  })
  const fetchIdRef = useRef(0)

  const loadAccess = useCallback(async (forceRefresh = false) => {
    const fetchId = ++fetchIdRef.current

    if (!forceRefresh) {
      const cachedResult = getCachedKycAccess()
      if (cachedResult?.verified) {
        setAccess({ ...cachedResult, loading: false })
        return cachedResult
      }
    }

    setAccess((current) => ({ ...current, loading: true, fetchError: false }))

    const result = forceRefresh
      ? await refreshFinancialKycAccess()
      : await fetchFinancialKycAccess()

    if (fetchId !== fetchIdRef.current) return result

    setAccess({ ...result, loading: false })
    return result
  }, [])

  useEffect(() => {
    void loadAccess()

    const refresh = () => {
      void loadAccess(true)
    }

    window.addEventListener('primefx:profile-updated', refresh)

    return () => {
      window.removeEventListener('primefx:profile-updated', refresh)
    }
  }, [loadAccess])

  const refresh = useCallback(() => loadAccess(true), [loadAccess])

  return { ...access, refresh }
}
