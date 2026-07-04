import type { ReactNode } from 'react'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { sectionStackClass } from '@/lib/layout/spacing'
import { cn } from '@/lib/utils'

type PageSectionProps = {
  children: ReactNode
  /** Visible section title — also used as default aria-label. */
  title?: string
  /** Override accessible name when title alone is insufficient. */
  ariaLabel?: string
  className?: string
  headingId?: string
}

export function PageSection({
  children,
  title,
  ariaLabel,
  className,
  headingId,
}: PageSectionProps) {
  return (
    <section aria-label={ariaLabel ?? title} className={cn(sectionStackClass, className)}>
      {title ? <SectionHeading id={headingId}>{title}</SectionHeading> : null}
      {children}
    </section>
  )
}
