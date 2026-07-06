'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (reduced) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-16 z-50 h-0.5 bg-gray-100"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
    >
      <div
        className="h-full bg-[#0052ff] transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%`, willChange: 'width' }}
      />
    </div>
  )
}
