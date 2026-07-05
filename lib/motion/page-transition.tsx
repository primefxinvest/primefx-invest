'use client'

import { m, AnimatePresence } from 'framer-motion'
import { usePathname } from '@/i18n/navigation'
import { MOTION_VARIANTS } from './tokens'
import { useReducedMotion } from './use-reduced-motion'

/** Smooth 150–250ms fade + slide on route change. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className="min-w-0">{children}</div>
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={pathname}
        className="min-w-0"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={MOTION_VARIANTS.page}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
