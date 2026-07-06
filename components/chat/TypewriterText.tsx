'use client'

import { cn } from '@/lib/utils'

type TypewriterTextProps = {
  text: string
  isTyping?: boolean
  className?: string
}

export function TypewriterText({ text, isTyping, className }: TypewriterTextProps) {
  return (
    <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', className)}>
      {text}
      {isTyping ? (
        <span
          className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle"
          aria-hidden
        />
      ) : null}
    </p>
  )
}
