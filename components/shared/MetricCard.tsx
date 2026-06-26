'use client'

import { ReactNode } from 'react'

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: string
  trend?: string
  trendColor?: 'green' | 'red' | 'orange'
}

export default function MetricCard({ icon, label, value, trend, trendColor = 'green' }: MetricCardProps) {
  const trendColorMap = {
    green: 'text-emerald-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {trend && <p className={`mt-1 text-xs font-semibold ${trendColorMap[trendColor]}`}>{trend}</p>}
        </div>
        <div className="text-primary">{icon}</div>
      </div>
    </div>
  )
}
