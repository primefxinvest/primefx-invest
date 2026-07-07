'use client'

import { BarChart3 } from 'lucide-react'
import { m } from 'framer-motion'

type MarketEmptyStateProps = {
  title: string
  description: string
}

export default function MarketEmptyState({ title, description }: MarketEmptyStateProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-gradient-to-br from-slate-50/80 to-white/70 px-6 py-16 text-center backdrop-blur-sm"
    >
      <m.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner"
      >
        <BarChart3 className="h-8 w-8" />
      </m.div>
      <h3 className="mt-5 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
    </m.div>
  )
}
