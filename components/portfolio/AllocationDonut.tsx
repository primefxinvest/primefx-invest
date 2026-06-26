'use client'

import Link from 'next/link'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieTooltipContent } from '@/components/charts/ChartTooltip'
import { chartTooltipWrapperProps } from '@/lib/charts/theme'

interface AllocationItem {
  name: string
  value: number
  amount: string
  color: string
}

interface AllocationDonutProps {
  data: AllocationItem[]
  totalValue: string
}

export default function AllocationDonut({ data, totalValue }: AllocationDonutProps) {
  return (
    <div>
      <h2 className="mb-5 text-[15px] font-semibold text-slate-900">Asset Allocation</h2>

      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total Value</p>
          <p className="mt-0.5 text-lg font-bold text-slate-900">{totalValue}</p>
        </div>
      </div>

      <div className="mt-2 space-y-2.5">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[13px] text-slate-600">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[13px] font-semibold text-slate-900">{item.value}%</span>
              <span className="ml-2 text-[12px] text-slate-400">{item.amount}</span>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/reports"
        className="mt-5 block w-full rounded-lg border border-slate-200 py-2 text-center text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        View Details
      </Link>
    </div>
  )
}
