'use client'

import { m } from 'framer-motion'
import { useId } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

type MarketSparklineProps = {
  up: boolean
  className?: string
  animated?: boolean
}

export default function MarketSparkline({ up, className, animated = true }: MarketSparklineProps) {
  const reduced = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const stroke = up ? '#10b981' : '#ef4444'
  const fillId = up ? `sparkUp-${uid}` : `sparkDown-${uid}`
  const line = up
    ? 'M0 22 C8 20 14 18 22 14 C30 10 36 8 44 6 C48 5 52 4 56 3'
    : 'M0 6 C8 8 14 11 22 13 C30 15 36 17 44 18 C48 19 52 20 56 21'
  const area = `${line} L56 24 L0 24 Z`

  const path = (
    <svg viewBox="0 0 56 24" className={cn('h-8 w-full min-w-[4rem]', className)} fill="none" aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path d={line} stroke={stroke} strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )

  if (!animated || reduced) return path

  return (
    <m.div
      initial={{ opacity: 0, scaleX: 0.9 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      style={{ transformOrigin: 'left center', willChange: 'transform, opacity' }}
    >
      {path}
    </m.div>
  )
}
