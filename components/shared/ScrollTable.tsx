import { cn } from '@/lib/utils'

interface ScrollTableProps {
  children: React.ReactNode
  className?: string
  /** Accessible name for the scrollable region. */
  ariaLabel?: string
}

/** Horizontally scrollable table wrapper with touch momentum on mobile. */
export function ScrollTable({ children, className, ariaLabel = 'Scrollable table' }: ScrollTableProps) {
  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={ariaLabel}
      className={cn(
        'min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]',
        className
      )}
    >
      {children}
    </div>
  )
}
