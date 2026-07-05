'use client'

import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type PrimeAIQuickActionsGridProps = {
  actions: Array<{ key: string; icon: LucideIcon; title: string; query: string }>
  pendingKey: string | null
  isLoading: boolean
  onAction: (query: string, key: string) => void
}

/** Compact 4×2 shortcut grid — ChatGPT / Perplexity style. */
export function PrimeAIQuickActionsGrid({
  actions,
  pendingKey,
  isLoading,
  onAction,
}: PrimeAIQuickActionsGridProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
      {actions.map(({ key, icon: Icon, title, query }) => {
        const isPending = pendingKey === key && isLoading
        return (
          <button
            key={key}
            type="button"
            disabled={isLoading}
            onClick={() => onAction(query, key)}
            className={cn(
              'group flex h-[4rem] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card p-1.5 text-center shadow-sm transition-all',
              'hover:border-primary/25 hover:bg-muted/20 hover:shadow-md',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-60',
              'sm:h-[4.25rem] sm:items-start sm:justify-between sm:p-2 sm:text-left',
              'lg:h-[4.5rem] lg:p-2.5'
            )}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary/15 sm:h-6 sm:w-6">
              {isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin sm:h-3 sm:w-3" aria-hidden />
              ) : (
                <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" aria-hidden />
              )}
            </span>
            <span className="line-clamp-2 w-full text-[9px] font-medium leading-tight text-foreground sm:text-[11px]">
              {title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
