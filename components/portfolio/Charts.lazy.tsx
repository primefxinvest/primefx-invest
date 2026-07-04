'use client'

import dynamic from 'next/dynamic'
import { ChartCardSkeleton } from '@/components/shared/skeletons'

export const PerformanceChart = dynamic(
  () => import('@/components/portfolio/PerformanceChart'),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-72" />,
  }
)

export const AllocationDonut = dynamic(
  () => import('@/components/portfolio/AllocationDonut'),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-64" />,
  }
)

export const MonthlyReturnsChart = dynamic(
  () => import('@/components/portfolio/MonthlyReturnsChart'),
  {
    ssr: false,
    loading: () => <ChartCardSkeleton height="h-64" />,
  }
)
