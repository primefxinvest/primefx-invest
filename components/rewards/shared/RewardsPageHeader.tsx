'use client'

import { memo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type RewardsPageHeaderProps = {
  icon: ReactNode
  title: string
  subtitle: string
  className?: string
}

function RewardsPageHeaderInner({ icon, title, subtitle, className }: RewardsPageHeaderProps) {
  return (
    <header className={cn('min-w-0', className)}>
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed]/10 text-[#7c3aed]">
          {icon}
        </span>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {title}
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
    </header>
  )
}

export const RewardsPageHeader = memo(RewardsPageHeaderInner)
