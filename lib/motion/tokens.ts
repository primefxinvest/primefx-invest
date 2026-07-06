/** PrimeFx motion design tokens — institutional fintech-grade timing. */

export const MOTION_DURATION = {
  instant: 0.1,
  fast: 0.15,
  normal: 0.2,
  slow: 0.25,
  drawer: 0.3,
} as const

export const MOTION_EASING = {
  /** Premium ease-out — Apple / Revolut feel */
  out: [0.32, 0.72, 0, 1] as const,
  /** Smooth in-out for modals */
  inOut: [0.4, 0, 0.2, 1] as const,
  /** Snappy spring-like exit */
  exit: [0.4, 0, 1, 1] as const,
}

export const MOTION_SPRING = {
  gentle: { type: 'spring' as const, stiffness: 380, damping: 32 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 35 },
}

export const MOTION_VARIANTS = {
  page: {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASING.exit },
    },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: MOTION_DURATION.normal } },
    exit: { opacity: 0, transition: { duration: MOTION_DURATION.fast } },
  },
  scale: {
    initial: { opacity: 0, scale: 0.96 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASING.out },
    },
    exit: {
      opacity: 0,
      scale: 0.98,
      transition: { duration: MOTION_DURATION.fast },
    },
  },
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASING.out },
    },
    exit: { opacity: 0, y: 8, transition: { duration: MOTION_DURATION.fast } },
  },
  staggerContainer: {
    animate: {
      transition: { staggerChildren: 0.05, delayChildren: 0.02 },
    },
  },
  staggerItem: {
    initial: { opacity: 0, y: 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASING.out },
    },
  },
  drawer: {
    closed: { x: '-100%' },
    open: {
      x: 0,
      transition: { duration: MOTION_DURATION.drawer, ease: MOTION_EASING.out },
    },
  },
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: MOTION_DURATION.normal } },
    exit: { opacity: 0, transition: { duration: MOTION_DURATION.fast } },
  },
} as const

/** Card hover — max scale 1.02 per design spec */
export const CARD_HOVER = {
  y: -2,
  scale: 1.02,
  transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASING.out },
}

export const CARD_TAP = {
  scale: 0.98,
  transition: { duration: MOTION_DURATION.instant },
}
