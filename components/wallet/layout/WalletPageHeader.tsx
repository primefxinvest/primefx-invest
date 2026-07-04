import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { pageHeaderGapClass } from '@/lib/layout/spacing'
import { dashboardMutedTextClass } from '@/lib/layout/surfaces'

export function WalletPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between',
        pageHeaderGapClass
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <p className={cn('mt-1', dashboardMutedTextClass)}>{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}
