import { cn } from '@/lib/utils'

type TrustDisclaimerProps = {
  children: React.ReactNode
  className?: string
  /** Defaults to investment risk disclosure */
  variant?: 'investment' | 'performance' | 'ai'
}

const VARIANT_CLASS = {
  investment: 'border-amber-200/80 bg-amber-50/60 text-amber-950/90',
  performance: 'border-border bg-muted/40 text-muted-foreground',
  ai: 'border-border bg-muted/30 text-muted-foreground',
} as const

/** Institutional disclaimer — regulated fintech tone, not marketing hype. */
export function TrustDisclaimer({
  children,
  className,
  variant = 'investment',
}: TrustDisclaimerProps) {
  return (
    <p
      role="note"
      className={cn(
        'rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed sm:text-xs',
        VARIANT_CLASS[variant],
        className
      )}
    >
      {children}
    </p>
  )
}
