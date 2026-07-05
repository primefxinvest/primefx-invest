'use client'

import { m, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { useReducedMotion } from './use-reduced-motion'

type AnimatedNumberProps = {
  value: number
  format?: (n: number) => string
  className?: string
}

/** Smooth counter transitions for KPI values. */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const reduced = useReducedMotion()
  const spring = useSpring(value, { stiffness: 120, damping: 20, mass: 0.4 })
  const display = useTransform(spring, (v) => (format ? format(v) : String(Math.round(v))))

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  if (reduced) {
    return <span className={className}>{format ? format(value) : String(value)}</span>
  }

  return <m.span className={className}>{display}</m.span>
}
