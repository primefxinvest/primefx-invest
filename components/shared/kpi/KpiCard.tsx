'use client'

import { memo, type ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { MotionCard } from '@/lib/motion'
import { statusCardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

export type KpiTrendColor = 'green' | 'red' | 'orange' | 'muted'

export type KpiCardProps = {
  label: string
  value: string
  icon?: ReactNode
  iconBg?: string
  /** Full caption line (wallet subtext, referral sub, etc.) */
  caption?: string
  captionClassName?: string
  /** Trend percentage only (e.g. +12.5%) */
  trend?: string
  /** Text after trend (e.g. "from last month") */
  trendSuffix?: string
  trendColor?: KpiTrendColor
  valueClassName?: string
  href?: string
  className?: string
}

const trendColorMap: Record<KpiTrendColor, string> = {
  green: 'text-emerald-600',
  red: 'text-destructive',
  orange: 'text-orange-600',
  muted: 'text-muted-foreground',
}

export function trendColorFromPercentage(value?: string): KpiTrendColor {
  if (!value) return 'green'
  const trimmed = value.trim()
  if (trimmed.startsWith('-') || trimmed.startsWith('−') || trimmed.includes('(')) {
    return 'red'
  }
  return 'green'
}

function KpiCardInner({
  label,
  value,
  icon,
  iconBg = 'bg-primary/10 text-primary',
  caption,
  captionClassName,
  trend,
  trendSuffix,
  trendColor = 'green',
  valueClassName,
  className,
}: KpiCardProps) {
  return (
    <MotionCard
      className={cn(
        statusCardSurfaceClass,
        'flex h-full min-h-[5.5rem] flex-col justify-between sm:min-h-[6rem]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
          <p
            className={cn(
              'mt-1 text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl lg:text-2xl',
              valueClassName
            )}
          >
            {value}
          </p>
          {trend ? (
            <p className={cn('mt-0.5 text-[10px] font-semibold sm:text-[11px]', trendColorMap[trendColor])}>
              {trend}
              {trendSuffix ? (
                <span className="font-normal text-muted-foreground"> {trendSuffix}</span>
              ) : null}
            </p>
          ) : caption ? (
            <p className={cn('mt-0.5 line-clamp-2 text-[10px] font-medium sm:text-[11px]', captionClassName)}>
              {caption}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 lg:h-10 lg:w-10',
              iconBg
            )}
            aria-hidden
          >
            {icon}
          </div>
        ) : null}
      </div>
    </MotionCard>
  )
}

function KpiCard({ href, ...props }: KpiCardProps) {
  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-xl transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <KpiCardInner {...props} />
      </Link>
    )
  }

  return <KpiCardInner {...props} />
}

export default memo(KpiCard)
