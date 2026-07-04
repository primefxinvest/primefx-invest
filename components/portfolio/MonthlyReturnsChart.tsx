'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, CartesianGrid } from 'recharts'
import {
  chartAxisStyle,
  chartGridStyle,
  ChartTooltipContent,
  chartTooltipWrapperProps,
  formatPercent,
} from '@/components/charts/ChartTooltip'

interface MonthlyReturnsProps {
  data: Array<{ month: string; value: number }>
  title?: string
}

export default function MonthlyReturnsChart({ data, title = 'Monthly Returns' }: MonthlyReturnsProps) {
  return (
    <div>
      <h2 className="mb-4 text-[15px] font-semibold text-slate-900 sr-only">{title}</h2>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...chartGridStyle} vertical={false} />
          <XAxis dataKey="month" {...chartAxisStyle} />
          <YAxis
            {...chartAxisStyle}
            tickFormatter={(v) => `${v}%`}
            width={36}
          />
          <Tooltip
            {...chartTooltipWrapperProps}
            cursor={{ fill: 'rgba(0, 82, 255, 0.06)' }}
            content={
              <ChartTooltipContent
                valueFormatter={(value) => formatPercent(value)}
                labelFormatter={(label) => String(label)}
              />
            }
          />
          <Bar dataKey="value" name="Monthly Return" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value >= 8 ? '#0052ff' : entry.value >= 5 ? '#60a5fa' : '#bfdbfe'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
