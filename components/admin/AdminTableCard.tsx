import { cn } from '@/lib/utils'

interface AdminTableCardProps {
  children: React.ReactNode
  className?: string
}

/** Scrollable table container for admin views on narrow screens. */
export function AdminTableCard({ children, className }: AdminTableCardProps) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-x-auto rounded-lg border border-border bg-card [-webkit-overflow-scrolling:touch]',
        className
      )}
    >
      {children}
    </div>
  )
}
