'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { cn } from '@/lib/utils'
import './hero-headline.css'

const ROTATING_PHRASES = [
  'Built for Investors.',
  'Powered by PrimeAI.',
  'Trusted Worldwide.',
  'Invest with Confidence.',
  'Secure Every Investment.',
  'Smart Investment Platform.',
  'AI-Powered Investing.',
  'Designed for Growth.',
  'Built for Financial Freedom.',
  'Institutional Grade.',
] as const

const ROTATE_MS = 3600
const EXIT_MS = 450

function HeroRotatingHeadline() {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (reduced) return

    const intervalId = setInterval(() => {
      setVisible(false)
      const swapId = setTimeout(() => {
        setIndex((current) => (current + 1) % ROTATING_PHRASES.length)
        setVisible(true)
      }, EXIT_MS)
      timeoutsRef.current.push(swapId)
    }, ROTATE_MS)

    return () => {
      clearInterval(intervalId)
      timeoutsRef.current.forEach(clearTimeout)
      timeoutsRef.current = []
    }
  }, [reduced])

  const phrase = ROTATING_PHRASES[index]

  return (
    <span
      className="relative inline-flex min-h-[1.12em] items-center justify-center lg:justify-start"
      aria-live="polite"
    >
      <span
        key={`${index}-${visible}`}
        className={cn(
          'inline-block bg-gradient-to-r from-[#0052ff] via-blue-600 to-indigo-600 bg-clip-text text-transparent',
          visible ? 'hero-headline-in' : 'hero-headline-out'
        )}
      >
        {phrase}
      </span>
    </span>
  )
}

export default memo(HeroRotatingHeadline)
