'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieTooltipContent } from '@/components/charts/ChartTooltip'
import { chartTooltipWrapperProps } from '@/lib/charts/theme'
import { AsyncState } from '@/components/shared/data-state'
import { DonutChartSkeleton } from '@/components/shared/skeletons'
import { useAsyncData } from '@/lib/hooks/useAsyncData'
import { fetchWalletData } from '@/lib/data/queries'
import { formatCurrency } from '@/lib/data/format'

export default function WalletBalanceDonut() {
  const { data: wallet, loading, error, reload } = useAsyncData(() => fetchWalletData(), [])

  const chartData =
    wallet?.balanceBreakdown.map((item) => ({
      name: item.label,
      value: item.percentage,
      color: item.color,
      amount: formatCurrency(item.value),
    })) ?? []

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">Balance Overview</h2>

      <AsyncState
        loading={loading}
        error={error}
        onRetry={reload}
        isEmpty={chartData.length === 0}
        emptyTitle="No balance data"
        emptyDescription="Fund your wallet to see balance distribution."
        skeleton={<DonutChartSkeleton />}
        compact
      >
        <>
          <div className="relative mt-4">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipWrapperProps} content={<PieTooltipContent valueSuffix="%" />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Total Balance</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{wallet?.totalBalance ?? '$0.00'}</p>
            </div>
          </div>

          <div className="mt-2 space-y-2.5">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-gray-900">{item.value}%</span>
                  <span className="ml-2 text-[11px] text-gray-400">{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      </AsyncState>
    </div>
  )
}
