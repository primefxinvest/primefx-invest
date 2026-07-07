'use client'

import { m } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

export default function HeroScrollIndicator() {
  const reduced = useReducedMotion()

  return (
    <div className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
      <m.div
        className="flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400">
          Scroll
        </span>
        <m.div
          className="flex h-10 w-6 items-start justify-center rounded-full border border-gray-300/80 bg-white/50 p-1.5 backdrop-blur-sm"
          animate={reduced ? undefined : { y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <m.div
            animate={reduced ? undefined : { y: [0, 8, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-3.5 w-3.5 text-[#0052ff]" />
          </m.div>
        </m.div>
      </m.div>
    </div>
  )
}
