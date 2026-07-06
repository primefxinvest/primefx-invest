'use client'

import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MOTION_VARIANTS } from './tokens'
import { useReducedMotion } from './use-reduced-motion'

type StaggerContainerProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'ul' | 'section'
  'aria-label'?: string
}

/** Staggered children entrance — tables, grids, lists. */
export function StaggerContainer({
  children,
  className,
  as = 'div',
  'aria-label': ariaLabel,
}: StaggerContainerProps) {
  const reduced = useReducedMotion()
  const Component = m[as]

  if (reduced) {
    const Static = as
    return (
      <Static className={cn(className)} aria-label={ariaLabel}>
        {children}
      </Static>
    )
  }

  return (
    <Component
      className={cn(className)}
      aria-label={ariaLabel}
      initial="initial"
      animate="animate"
      variants={MOTION_VARIANTS.staggerContainer}
    >
      {children}
    </Component>
  )
}

type StaggerItemProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'li' | 'tr'
}

export function StaggerItem({ children, className, as = 'div' }: StaggerItemProps) {
  const reduced = useReducedMotion()
  const Component = m[as]

  if (reduced) {
    const Static = as
    return <Static className={cn(className)}>{children}</Static>
  }

  return (
    <Component className={cn(className)} variants={MOTION_VARIANTS.staggerItem}>
      {children}
    </Component>
  )
}
