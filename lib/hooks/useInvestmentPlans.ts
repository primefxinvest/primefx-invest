'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { InvestmentPlan } from '@/lib/data/types'
import {
  INVESTMENT_PLANS_REQUEST_TIMEOUT_MS,
  INVESTMENT_PLANS_CACHE_KEY,
  loadInvestmentPlansCached,
  readCachedInvestmentPlans,
} from '@/lib/invest/plans-cache'
import { invalidateAsyncCache } from '@/lib/hooks/async-cache'

export function useInvestmentPlans() {
  const initialCache = useRef(readCachedInvestmentPlans())
  const [data, setData] = useState<InvestmentPlan[] | undefined>(initialCache.current)
  const [loading, setLoading] = useState(initialCache.current === undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let timedOut = false

    const timeoutId = window.setTimeout(() => {
      if (!active) return
      timedOut = true
      if (initialCache.current === undefined) {
        setLoading(false)
        setError('Request timed out. Please try again.')
      }
    }, INVESTMENT_PLANS_REQUEST_TIMEOUT_MS)

    void loadInvestmentPlansCached((fresh) => {
      if (active) setData(fresh)
    })
      .then((plans) => {
        if (!active || timedOut) return
        setData(plans)
        setError(null)
      })
      .catch((err) => {
        if (!active || timedOut) return
        if (initialCache.current === undefined) {
          setError(err instanceof Error ? err.message : 'Failed to load investment plans')
        }
      })
      .finally(() => {
        if (!active) return
        window.clearTimeout(timeoutId)
        setLoading(false)
        setIsRefreshing(false)
      })

    return () => {
      active = false
      window.clearTimeout(timeoutId)
    }
  }, [])

  const reload = useCallback(async () => {
    const hadData = data !== undefined
    setLoading(!hadData)
    setIsRefreshing(hadData)
    setError(null)
    invalidateAsyncCache(INVESTMENT_PLANS_CACHE_KEY)

    try {
      const plans = await loadInvestmentPlansCached()
      setData(plans)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load investment plans')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [data])

  return {
    data: data ?? [],
    loading: loading && data === undefined,
    isRefreshing,
    error,
    reload,
  }
}
