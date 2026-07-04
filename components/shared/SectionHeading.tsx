import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  children: ReactNode
  className?: string
  id?: string
}

export function SectionHeading({ children, className, id }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className={cn(
        'text-[11px] font-bold uppercase tracking-wider text-muted-foreground',
        className
      )}
    >
      {children}
    </h2>
  )
}
