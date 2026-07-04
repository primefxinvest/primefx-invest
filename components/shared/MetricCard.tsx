'use client'

import { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { statusCardSurfaceClass } from '@/lib/layout/surfaces'

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
  iconBg = 'bg-primary/10 text-primary',
}: MetricCardProps) {
  const t = useTranslations('dashboard')
  const trendColorMap = {
    green: 'text-emerald-600',
    red: 'text-destructive',
    orange: 'text-orange-600',
  }

  return (
    <div className={statusCardSurfaceClass}>
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">{label}</p>
          <p className="mt-0.5 text-lg font-bold text-foreground sm:text-xl">{value}</p>
          {trend && (
            <p className={`mt-0.5 text-[10px] font-semibold sm:text-xs ${trendColorMap[trendColor]}`}>
              {trend}{' '}
              <span className="font-normal text-muted-foreground">{t('fromLastMonth')}</span>
            </p>
          )}
        </div>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
