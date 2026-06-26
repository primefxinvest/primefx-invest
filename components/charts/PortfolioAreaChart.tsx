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

interface PortfolioAreaChartProps {
  data: Array<{ month: string; value: number }>
  height?: number
  valueLabel?: string
  gradientColor?: string
}

export function PortfolioAreaChart({
  data,
  height = 300,
  valueLabel = 'Portfolio Value',
  gradientColor = '#0052ff',
}: PortfolioAreaChartProps) {
  const gradientId = useId().replace(/:/g, '')

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity={0.22} />
            <stop offset="55%" stopColor={gradientColor} stopOpacity={0.08} />
            <stop offset="100%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...chartGridStyle} />
        <XAxis dataKey="month" {...chartAxisStyle} dy={8} />
        <YAxis
          {...chartAxisStyle}
          width={52}
          tickFormatter={(v) => v.toLocaleString('en-US')}
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
          name={valueLabel}
          stroke={gradientColor}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={areaChartActiveDot}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
