import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type StatusCardGridProps = {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5
  className?: string
}

const columnClasses: Record<2 | 3 | 4 | 5, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-2 xl:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}

/** Two columns on mobile, expanding on larger breakpoints. */
export function StatusCardGrid({ children, columns = 4, className }: StatusCardGridProps) {
  return (
    <div className={cn('grid gap-3 sm:gap-4', columnClasses[columns], className)}>
      {children}
    </div>
  )
}

export const statusCardSurfaceClass =
  'rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 xl:p-5'

export const statusCardAdminSurfaceClass =
  'rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 xl:p-5'

type StatusMetricCardProps = {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
  className?: string
}

const toneIconBg: Record<NonNullable<StatusMetricCardProps['tone']>, string> = {
  default: 'bg-gray-100 text-gray-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  primary: 'bg-primary/10 text-primary',
}

export function StatusMetricCard({
  label,
  value,
  sub,
  icon,
  tone = 'default',
  className,
}: StatusMetricCardProps) {
  return (
    <div className={cn(statusCardSurfaceClass, className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-gray-500 sm:text-sm">{label}</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-gray-900 sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {sub ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] text-gray-500 sm:mt-1 sm:text-xs">{sub}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl',
              toneIconBg[tone]
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  )
}
