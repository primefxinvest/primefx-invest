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
          ? 'min-h-[3.5rem] p-2 max-md:min-h-[3.25rem] max-md:p-1.5 sm:min-h-[4.75rem] sm:p-3'
          : 'min-h-[7.5rem] p-4 sm:p-5'
      )}
    >
      <div className="flex items-start justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'truncate text-muted-foreground',
              compact ? 'text-[10px] leading-tight sm:text-[11px]' : 'text-sm'
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              'mt-0.5 font-bold tabular-nums text-foreground',
              compact ? 'text-base leading-tight sm:text-lg' : 'mt-1 text-2xl'
            )}
          >
            {value}
          </p>
          {subtext ? (
            <p
              className={cn(
                'truncate text-muted-foreground',
                compact ? 'mt-0.5 text-[9px] leading-tight sm:text-[10px]' : 'mt-1 text-xs'
              )}
            >
              {subtext}
            </p>
          ) : null}
          {trend ? (
            <p
              className={cn(
                'font-semibold',
                compact ? 'mt-0.5 text-[9px]' : 'mt-1 text-xs',
                trend.positive ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              {trend.text}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-lg sm:rounded-xl',
            compact ? 'h-7 w-7 sm:h-8 sm:w-8' : 'h-11 w-11',
            iconClassName ?? 'bg-primary/10 text-primary'
          )}
        >
          <Icon className={cn(compact ? 'h-3 w-3 sm:h-3.5 sm:w-3.5' : 'h-5 w-5')} />
        </div>
      </div>
    </div>
  )
}
