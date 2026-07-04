'use client'

import dynamic from 'next/dynamic'
import { ChartCardSkeleton } from '@/components/shared/skeletons'

export const PortfolioChart = dynamic(
  () =>
    import('@/components/charts/PortfolioAreaChart').then((mod) => ({
      default: mod.PortfolioAreaChart,
    })),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-[220px]" />,
  }
)

export const AssetAllocationChart = dynamic(
  () =>
    import('@/components/charts/AssetAllocationChart').then((mod) => ({
      default: mod.AssetAllocationChart,
    })),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-[180px]" />,
  }
)
