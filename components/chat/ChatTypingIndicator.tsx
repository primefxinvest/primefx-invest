'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatTypingIndicatorProps = {
  label: string
  className?: string
  compact?: boolean
}

export function ChatTypingIndicator({ label, className, compact }: ChatTypingIndicatorProps) {
  return (
    <div className={cn('flex gap-2.5', className)} role="status" aria-live="polite">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-sm',
          compact ? 'h-8 w-8' : 'h-9 w-9'
        )}
      >
        <Sparkles className={cn('text-white', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
      </div>
      <div
        className={cn(
          'rounded-2xl rounded-tl-md border border-border bg-card shadow-sm',
          compact ? 'px-3.5 py-2.5' : 'px-4 py-3 sm:max-w-lg'
        )}
      >
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        <div className="mt-1.5 flex items-center gap-1" aria-hidden="true">
          <span className="h-1.5 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-1.5 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <span className="h-1.5 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
