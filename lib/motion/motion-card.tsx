'use client'

import { m } from 'framer-motion'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { CARD_HOVER, CARD_TAP } from './tokens'
import { useReducedMotion } from './use-reduced-motion'

type MotionCardProps = ComponentProps<'div'> & {
  interactive?: boolean
}

/** Premium card surface with subtle hover lift (max scale 1.02). */
export function MotionCard({
  className,
  children,
  interactive = true,
  ...props
}: MotionCardProps) {
  const reduced = useReducedMotion()

  if (reduced || !interactive) {
    return (
      <div className={cn(className)} {...props}>
        {children}
      </div>
    )
  }

  return (
    <m.div
      className={cn(className)}
      whileHover={CARD_HOVER}
      whileTap={CARD_TAP}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {children}
    </m.div>
  )
}
