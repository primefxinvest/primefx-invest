'use client'

import { m } from 'framer-motion'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 11) % 100}%`,
  top: `${(i * 23 + 7) % 100}%`,
  size: 2 + (i % 3),
  delay: (i % 6) * 0.4,
}))

export default function HeroBackground() {
  const reduced = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/90 to-blue-50/60" />

      <m.div
        className="absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-gradient-to-br from-blue-400/20 via-blue-300/10 to-transparent blur-3xl"
        animate={reduced ? undefined : { x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      />
      <m.div
        className="absolute -right-1/4 top-1/4 h-[60%] w-[60%] rounded-full bg-gradient-to-bl from-indigo-300/15 via-purple-200/10 to-transparent blur-3xl"
        animate={reduced ? undefined : { x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      />
      <m.div
        className="absolute bottom-0 left-1/3 h-[45%] w-[50%] rounded-full bg-gradient-to-t from-emerald-200/15 to-transparent blur-3xl"
        animate={reduced ? undefined : { scale: [1, 1.05, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{ willChange: 'transform' }}
      />

      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,82,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,82,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)',
        }}
      />

      <m.div
        className="absolute left-1/2 top-0 h-[500px] w-[2px] -translate-x-1/2 bg-gradient-to-b from-blue-400/30 via-blue-300/10 to-transparent"
        animate={reduced ? undefined : { opacity: [0.2, 0.5, 0.2], scaleY: [0.8, 1, 0.8] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <m.div
        className="absolute right-[20%] top-0 h-[400px] w-px bg-gradient-to-b from-purple-400/25 via-purple-300/10 to-transparent"
        animate={reduced ? undefined : { opacity: [0.15, 0.4, 0.15] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {PARTICLES.map((particle) => (
        <m.span
          key={particle.id}
          className="absolute rounded-full bg-blue-400/40"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            willChange: 'transform, opacity',
          }}
          animate={
            reduced
              ? undefined
              : {
                  opacity: [0.15, 0.6, 0.15],
                  scale: [1, 1.4, 1],
                }
          }
          transition={{
            duration: 4 + (particle.id % 3),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  )
}
