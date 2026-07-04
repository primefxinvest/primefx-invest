'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieTooltipContent } from '@/components/charts/ChartTooltip'
import { chartTooltipWrapperProps } from '@/lib/charts/theme'

interface PieChartDataItem {
  name: string
  value: number
  color: string
}

interface AssetAllocationChartProps {
  data: PieChartDataItem[]
  height?: number
}

export function AssetAllocationChart({ data, height = 180 }: AssetAllocationChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip {...chartTooltipWrapperProps} content={<PieTooltipContent />} />
      </PieChart>
    </ResponsiveContainer>
  )
}
