import { Shield } from 'lucide-react'
import { dashboardCardClass, dashboardMutedTextClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

export default function SecurityWidget() {
  return (
    <div className={cn(dashboardCardClass)}>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <Shield className="h-5 w-5 text-emerald-600" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <p className={dashboardMutedTextClass}>Security Status</p>
          <p className="text-lg font-bold text-emerald-600">Very Strong</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums text-foreground">92</p>
          <p className="text-[10px] text-muted-foreground">/100</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={92} aria-valuemin={0} aria-valuemax={100} aria-label="Security score">
        <div className="h-full w-[92%] rounded-full bg-emerald-500 transition-[width] duration-300" />
      </div>
      <p className={cn('mt-2', dashboardMutedTextClass)}>Your account is well protected</p>
    </div>
  )
}
