import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WalletStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  trend,
  compact = false,
}: {
  label: string
  value: string
  subtext?: string
  icon: LucideIcon
  iconClassName?: string
  trend?: { text: string; positive?: boolean }
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        compact
          ? 'min-h-[4.5rem] p-2.5 sm:min-h-[5.5rem] sm:p-3.5'
          : 'min-h-[7.5rem] p-4 sm:p-5'
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className={cn('text-muted-foreground', compact ? 'text-[11px] sm:text-xs' : 'text-sm')}>
            {label}
          </p>
          <p
            className={cn(
              'mt-0.5 font-bold tabular-nums text-foreground',
              compact ? 'text-lg sm:text-xl' : 'mt-1 text-2xl'
            )}
          >
            {value}
          </p>
          {subtext ? (
            <p className={cn('text-muted-foreground', compact ? 'mt-0.5 text-[10px] sm:text-xs' : 'mt-1 text-xs')}>
              {subtext}
            </p>
          ) : null}
          {trend ? (
            <p
              className={cn(
                'font-semibold',
                compact ? 'mt-0.5 text-[10px]' : 'mt-1 text-xs',
                trend.positive ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {trend.text}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-xl',
            compact ? 'h-8 w-8 sm:h-9 sm:w-9' : 'h-11 w-11',
            iconClassName ?? 'bg-primary/10 text-primary'
          )}
        >
          <Icon className={cn(compact ? 'h-3.5 w-3.5 sm:h-4 sm:w-4' : 'h-5 w-5')} />
        </div>
      </div>
    </div>
  )
}
