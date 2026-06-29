'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  trend?: string
  trendColor?: 'green' | 'red' | 'orange'
  iconBg?: string
}

export default function MetricCard({
  icon,
  label,
  value,
  trend,
  trendColor = 'green',
  iconBg = 'bg-blue-50 text-[#0052ff]',
}: MetricCardProps) {
  const trendColorMap = {
    green: 'text-emerald-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-gray-500 sm:text-sm">{label}</p>
          <p className="mt-1 text-lg font-bold text-gray-900 sm:text-2xl">{value}</p>
          {trend && (
            <p className={`mt-0.5 text-[10px] font-semibold sm:mt-1 sm:text-xs ${trendColorMap[trendColor]}`}>
              {trend} <span className="font-normal text-gray-400">from last month</span>
            </p>
          )}
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
