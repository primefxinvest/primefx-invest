import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AuthFormShellProps = {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function AuthFormShell({ title, subtitle, children, footer, className }: AuthFormShellProps) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl border border-border/80 bg-card p-6 shadow-xl shadow-black/[0.04] sm:p-8 lg:rounded-3xl lg:p-9',
        className
      )}
    >
      <header className="mb-6 sm:mb-7">
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
        <div className="mt-1.5 text-sm text-muted-foreground">{subtitle}</div>
      </header>
      {children}
      {footer ? <footer className="mt-6 space-y-3 border-t border-border/60 pt-5">{footer}</footer> : null}
    </div>
  )
}
