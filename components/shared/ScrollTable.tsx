import { cn } from '@/lib/utils'

interface ScrollTableProps {
  children: React.ReactNode
  className?: string
}

/** Horizontally scrollable table wrapper with touch momentum on mobile. */
export function ScrollTable({ children, className }: ScrollTableProps) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-x-auto [-webkit-overflow-scrolling:touch]',
        className
      )}
    >
      {children}
    </div>
  )
}
