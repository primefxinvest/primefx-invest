'use client'

import dynamic from 'next/dynamic'
import { DonutChartSkeleton } from '@/components/shared/skeletons'

export const WalletBalanceDonut = dynamic(
  () => import('@/components/wallet/WalletBalanceDonut'),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <DonutChartSkeleton />
      </div>
    ),
  }
)
