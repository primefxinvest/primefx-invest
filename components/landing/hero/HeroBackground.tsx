'use client'

import { memo } from 'react'

const STATIC_DOTS = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${(i * 19 + 12) % 100}%`,
  top: `${(i * 27 + 8) % 100}%`,
  size: 2 + (i % 2),
}))

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50/90 to-blue-50/60" />

      <div className="absolute -left-1/4 top-0 h-[60%] w-[60%] rounded-full bg-gradient-to-br from-blue-400/12 via-blue-300/6 to-transparent md:blur-2xl" />
      <div className="absolute -right-1/4 top-1/4 h-[50%] w-[50%] rounded-full bg-gradient-to-bl from-indigo-300/10 via-purple-200/6 to-transparent md:blur-2xl" />

      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,82,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,82,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%)',
        }}
      />

      {STATIC_DOTS.map((dot) => (
        <span
          key={dot.id}
          className="absolute rounded-full bg-blue-400/25"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
          }}
        />
      ))}
    </div>
  )
}

export default memo(HeroBackground)
