import { CheckCircle2, type LucideIcon } from 'lucide-react'
import { MotionCard } from '@/lib/motion/motion-card'
import { cn } from '@/lib/utils'

export function SectionShell({
  id,
  className,
  children,
  variant = 'default',
}: {
  id?: string
  className?: string
  children: React.ReactNode
  variant?: 'default' | 'muted' | 'blue'
}) {
  return (
    <section
      id={id}
      className={cn(
        'py-14 sm:py-16 lg:py-20',
        variant === 'muted' && 'bg-gray-50',
        variant === 'blue' && 'bg-gradient-to-br from-[#0052ff] via-[#0046d9] to-[#003bb8] text-white',
        variant === 'default' && 'bg-white',
        className
      )}
    >
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
  light?: boolean
}) {
  return (
    <div
      className={cn(
        'mb-10 sm:mb-12',
        align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            'text-xs font-semibold tracking-widest uppercase',
            light ? 'text-blue-200' : 'text-[#0052ff]'
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'mt-3 text-2xl font-bold sm:text-3xl lg:text-4xl',
          light ? 'text-white' : 'text-gray-900'
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mt-3 text-sm leading-relaxed sm:text-base',
            light ? 'text-blue-100' : 'text-gray-600'
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}

export function InfoCard({
  className,
  children,
  interactive = true,
}: {
  className?: string
  children: React.ReactNode
  interactive?: boolean
}) {
  return (
    <MotionCard
      interactive={interactive}
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6',
        className
      )}
    >
      {children}
    </MotionCard>
  )
}

export function CheckList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function IconBadge({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex size-11 items-center justify-center rounded-xl bg-blue-50 text-[#0052ff]',
        className
      )}
    >
      <Icon className="size-5" aria-hidden />
    </div>
  )
}
