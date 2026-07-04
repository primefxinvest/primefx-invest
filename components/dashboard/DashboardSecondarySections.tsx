'use client'

import { useEffect, useState } from 'react'
import DashboardStatusCards from '@/components/dashboard/DashboardStatusCards'
import { MetricCardsSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { CACHE_KEYS } from '@/lib/data/cache-keys'
import {
  fetchLearningProgress,
  fetchReferralData,
  fetchRewardsData,
} from '@/lib/data/queries'

const CACHE_OPTS = { cacheTtlMs: 30_000 } as const

export default function DashboardSecondarySections() {
  const { data: rewards } = useAsyncData(() => fetchRewardsData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: CACHE_KEYS.rewardsData,
  })
  const { data: referral } = useAsyncData(() => fetchReferralData(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-referral-data',
  })
  const { data: learning } = useAsyncData(() => fetchLearningProgress(), [], undefined, {
    ...CACHE_OPTS,
    cacheKey: 'dashboard-learning-progress',
  })

  return <DashboardStatusCards rewards={rewards} referral={referral} learning={learning} />
}

export function DashboardSecondarySectionsDeferred() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => setReady(true), { timeout: 1500 })
      return () => window.cancelIdleCallback(id)
    }

    const timer = window.setTimeout(() => setReady(true), 150)
    return () => window.clearTimeout(timer)
  }, [])

  if (!ready) {
    return <MetricCardsSkeleton count={4} />
  }

  return <DashboardSecondarySections />
}
