'use client'

import dynamic from 'next/dynamic'
import { TableSkeleton } from '@/components/shared/skeletons'

export const InvestPlansTable = dynamic(
  () => import('@/components/invest/InvestPlansTable'),
  {
    ssr: false,
    loading: () => <TableSkeleton rows={4} cols={6} />,
  }
)

export const PlanCompareView = dynamic(
  () => import('@/components/invest/PlanCompareView'),
  {
    ssr: false,
    loading: () => <TableSkeleton rows={6} cols={4} />,
  }
)

export const InvestHowItWorksPanel = dynamic(
  () => import('@/components/invest/InvestHowItWorksPanel'),
  { ssr: false }
)

export const TrustFeaturesBar = dynamic(
  () => import('@/components/invest/TrustFeaturesBar'),
  { ssr: false }
)

export const AIRecommendationBanner = dynamic(
  () => import('@/components/invest/AIRecommendationBanner'),
  { ssr: false }
)

export const InvestPrimeAIWidget = dynamic(
  () => import('@/components/invest/InvestPrimeAIWidget'),
  { ssr: false }
)

export const InvestPlanCard = dynamic(
  () => import('@/components/invest/InvestPlanCard'),
  { ssr: false }
)
