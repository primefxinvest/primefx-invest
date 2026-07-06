'use client'

import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CARD_HOVER, CARD_TAP } from './tokens'
import { useReducedMotion } from './use-reduced-motion'

type MotionCardProps = {
  className?: string
  children?: ReactNode
  interactive?: boolean
}

/** Premium card surface with subtle hover lift (max scale 1.02). */
export function MotionCard({
  className,
  children,
  interactive = true,
}: MotionCardProps) {
  const reduced = useReducedMotion()

  if (reduced || !interactive) {
    return <div className={cn(className)}>{children}</div>
  }

  return (
    <m.div
      className={cn(className)}
      whileHover={CARD_HOVER}
      whileTap={CARD_TAP}
      style={{ willChange: 'transform' }}
    >
      {children}
    </m.div>
  )
}
