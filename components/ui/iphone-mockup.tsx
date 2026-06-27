import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface IPhoneMockupProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  screenClassName?: string
  /** Scale the entire device (e.g. 0.85 on mobile) */
  scale?: number
  /** Compact screen height — fits content without empty space below */
  compact?: boolean
}

/**
 * iPhone-style device frame (21st.dev / lovesickfromthe6ix pattern).
 * Wrap app preview content in the screen area.
 */
export default function IPhoneMockup({
  children,
  className,
  screenClassName,
  scale = 1,
  compact = false,
  style,
  ...props
}: IPhoneMockupProps) {
  return (
    <div
      className={cn('relative mx-auto w-fit', className)}
      style={{ transform: scale === 1 ? undefined : `scale(${scale})`, ...style }}
      {...props}
    >
      <div className="relative rounded-[2.75rem] border-[10px] border-zinc-800 bg-zinc-800 p-1 shadow-2xl shadow-blue-950/30">
        {!compact && (
          <>
            <div className="absolute -left-[13px] top-[4.5rem] h-8 w-[3px] rounded-l-sm bg-zinc-700" />
            <div className="absolute -left-[13px] top-[6.75rem] h-12 w-[3px] rounded-l-sm bg-zinc-700" />
            <div className="absolute -left-[13px] top-[9.5rem] h-12 w-[3px] rounded-l-sm bg-zinc-700" />
            <div className="absolute -right-[13px] top-[7rem] h-16 w-[3px] rounded-r-sm bg-zinc-700" />
          </>
        )}

        <div
          className={cn(
            'relative overflow-hidden rounded-[2.1rem] bg-[#0c1633]',
            compact
              ? 'w-[220px]'
              : 'h-[520px] w-[240px] sm:h-[560px] sm:w-[260px]',
            screenClassName
          )}
        >
          <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-[22px] w-[72px] -translate-x-1/2 rounded-full bg-black" />

          <div
            className={cn(
              'relative z-10 w-full overflow-hidden px-3 pb-4 pt-9',
              compact ? 'h-auto' : 'h-full'
            )}
          >
            {children}
          </div>
        </div>
      </div>

      {!compact && (
        <div className="absolute -bottom-3 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-full bg-blue-900/20 blur-md" />
      )}
    </div>
  )
}
