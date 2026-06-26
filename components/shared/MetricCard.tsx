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
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`mt-1 text-xs font-semibold ${trendColorMap[trendColor]}`}>
              {trend} <span className="font-normal text-gray-400">from last month</span>
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
