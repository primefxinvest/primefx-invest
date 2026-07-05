'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type ReferralPageHeaderProps = {
  icon: ReactNode
  title: string
  subtitle: string
  action?: ReactNode
  className?: string
}

function ReferralPageHeaderInner({ icon, title, subtitle, action, className }: ReferralPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

export const ReferralPageHeader = memo(ReferralPageHeaderInner)
