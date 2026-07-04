import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { sectionHeaderMbClass } from '@/lib/layout/spacing'

type DashboardSectionHeaderProps = {
  title: string
  action?: ReactNode
  className?: string
}

export function DashboardSectionHeader({ title, action, className }: DashboardSectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', sectionHeaderMbClass, className)}>
      <h2 className={dashboardSectionTitleClass}>{title}</h2>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
