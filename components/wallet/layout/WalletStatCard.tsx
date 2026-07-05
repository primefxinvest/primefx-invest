import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WalletStatCard({
  label,
  value,
  subtext,
  icon: Icon,
  iconClassName,
  trend,
}: {
  label: string
  value: string
  subtext?: string
  icon: LucideIcon
  iconClassName?: string
  trend?: { text: string; positive?: boolean }
}) {
  return (
    <div className="flex h-full min-h-[7.5rem] flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-gray-400">{subtext}</p> : null}
          {trend ? (
            <p
              className={cn(
                'mt-1 text-xs font-semibold',
                trend.positive ? 'text-emerald-600' : 'text-gray-500'
              )}
            >
              {trend.text}
            </p>
          ) : null}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            iconClassName ?? 'bg-blue-50 text-[#0052ff]'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
