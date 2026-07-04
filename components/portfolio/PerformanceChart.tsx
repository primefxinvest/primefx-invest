'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  areaChartActiveDot,
  chartAxisStyle,
  chartGridStyle,
  ChartTooltipContent,
  chartTooltipCursor,
  chartTooltipWrapperProps,
  formatCurrency,
} from '@/components/charts/ChartTooltip'
import type { PortfolioChartPeriod } from '@/lib/data/portfolio-performance'

const periods = ['1M', '6M', '1Y', '3Y', 'All'] as const satisfies readonly PortfolioChartPeriod[]

interface PerformanceChartProps {
  data: Array<{ month: string; value: number }>
  stats: {
    bestMonth: string
    avgMonthlyReturn: string
    winningMonths: string
    maxDrawdown: string
  }
  period: PortfolioChartPeriod
  onPeriodChange: (period: PortfolioChartPeriod) => void
}

export default function PerformanceChart({
  data,
  stats,
  period,
  onPeriodChange,
}: PerformanceChartProps) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold text-slate-900">Portfolio Performance</h2>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-white text-[#0052ff] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
          No performance history yet. Invest to start tracking portfolio value over time.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0052ff" stopOpacity={0.22} />
              <stop offset="55%" stopColor="#0052ff" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#0052ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...chartGridStyle} />
          <XAxis dataKey="month" {...chartAxisStyle} dy={8} />
          <YAxis
            {...chartAxisStyle}
            width={48}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            {...chartTooltipWrapperProps}
            cursor={chartTooltipCursor}
            content={
              <ChartTooltipContent
                valueFormatter={(value) => formatCurrency(value)}
                labelFormatter={(label) => String(label)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="value"
            name="Portfolio Value"
            stroke="#0052ff"
            strokeWidth={2.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={areaChartActiveDot}
          />
        </AreaChart>
      </ResponsiveContainer>
      )}

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
        {[
          { label: 'Best Month', value: stats.bestMonth, positive: true },
          { label: 'Avg. Monthly Return', value: stats.avgMonthlyReturn, positive: true },
          { label: 'Winning Months', value: stats.winningMonths, neutral: true },
          { label: 'Max Drawdown', value: stats.maxDrawdown, positive: false },
        ].map((item) => (
          <div key={item.label} className="bg-white px-4 py-3">
            <p className="text-[11px] text-slate-400">{item.label}</p>
            <p
              className={`mt-0.5 text-sm font-semibold ${
                item.neutral
                  ? 'text-slate-800'
                  : item.positive
                    ? 'text-emerald-600'
                    : 'text-red-500'
              }`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
