'use client'

import { memo, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ReferralCompactKpiProps = {
  label: string
  value: string
  subtext?: string
  subtextClassName?: string
  icon: ReactNode
  iconBg?: string
  className?: string
}

function ReferralCompactKpiInner({
  label,
  value,
  subtext,
  subtextClassName,
  icon,
  iconBg = 'bg-primary/10 text-primary',
  className,
}: ReferralCompactKpiProps) {
  return (
    <div
      className={cn(
        'flex h-full min-h-[5.25rem] flex-col rounded-xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:min-h-[5.5rem] sm:p-3.5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8',
            iconBg
          )}
          aria-hidden
        >
          {icon}
        </div>
        <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
      </div>
      <p className="mt-2 truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]">
        {label}
      </p>
      <p className="mt-0.5 truncate text-base font-bold leading-tight tracking-tight text-foreground sm:text-lg">
        {value}
      </p>
      {subtext ? (
        <p
          className={cn(
            'mt-0.5 truncate text-[10px] font-semibold sm:text-[11px]',
            subtextClassName ?? 'text-muted-foreground'
          )}
        >
          {subtext}
        </p>
      ) : null}
    </div>
  )
}

export const ReferralCompactKpi = memo(ReferralCompactKpiInner)

export function ReferralCompactKpiGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-5',
        className
      )}
      aria-label="Referral overview metrics"
    >
      {children}
    </div>
  )
}
