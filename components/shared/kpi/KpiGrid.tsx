import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type KpiGridCount = 4 | 5

type KpiGridProps = {
  count: KpiGridCount
  children: ReactNode
  className?: string
  'aria-label'?: string
}

const countGridClass: Record<KpiGridCount, string> = {
  4: cn(
    'grid-cols-2',
    'md:grid-cols-2',
    'lg:grid-cols-4'
  ),
  5: cn(
    'grid-cols-2',
    'md:grid-cols-3',
    'lg:grid-cols-5',
    '[&>:nth-child(5)]:col-span-2 md:[&>:nth-child(5)]:col-span-1'
  ),
}

/**
 * Responsive KPI row system:
 * - 5 cards: mobile 2×2 + full-width ROI; tablet 3+2; desktop 1×5
 * - 4 cards: mobile 2×2; tablet 2×2; desktop 1×4
 */
export function KpiGrid({ count, children, className, 'aria-label': ariaLabel }: KpiGridProps) {
  return (
    <div
      className={cn(
        'grid w-full min-w-0 items-stretch gap-3 sm:gap-4',
        countGridClass[count],
        className
      )}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}
