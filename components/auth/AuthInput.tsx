import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AuthInputProps = {
  id: string
  label: string
  type?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: ReactNode
  trailing?: ReactNode
  disabled?: boolean
  autoComplete?: string
  name?: string
  className?: string
}

export function AuthInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  trailing,
  disabled,
  autoComplete,
  name,
  className,
}: AuthInputProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            'min-h-11 w-full rounded-xl border border-border bg-background py-2.5 text-sm transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-10 pr-3.5' : 'px-3.5',
            trailing ? 'pr-11' : undefined
          )}
        />
        {trailing ? (
          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">{trailing}</div>
        ) : null}
      </div>
    </div>
  )
}
