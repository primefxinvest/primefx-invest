'use client'

import dynamic from 'next/dynamic'
import { ChartCardSkeleton, MetricCardsSkeleton, PlanCardsSkeleton } from '@/components/shared/skeletons'
import { ListSkeleton } from '@/components/shared/skeletons'

export const DashboardPlansCarousel = dynamic(
  () => import('@/components/dashboard/DashboardPlansCarousel'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <PlanCardsSkeleton />
      </div>
    ),
  }
)

export const DashboardQuickActions = dynamic(
  () => import('@/components/dashboard/DashboardQuickActions'),
  {
    ssr: false,
    loading: () => <MetricCardsSkeleton count={2} />,
  }
)

export const DashboardMarketSection = dynamic(
  () => import('@/components/dashboard/DashboardMarketSection'),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-48" />,
  }
)

export const DashboardRecentTransactions = dynamic(
  () => import('@/components/dashboard/DashboardRecentTransactions'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <ListSkeleton rows={4} />
      </div>
    ),
  }
)

export const DashboardSecondarySectionsDeferred = dynamic(
  () =>
    import('@/components/dashboard/DashboardSecondarySections').then((mod) => ({
      default: mod.DashboardSecondarySectionsDeferred,
    })),
  {
    ssr: false,
    loading: () => <MetricCardsSkeleton count={2} />,
  }
)
