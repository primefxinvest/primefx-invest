'use client'

import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type TimelineEvent = {
  id: string
  title: string
  subtitle: string
  date: string
  status: 'completed' | 'active' | 'pending'
}

interface PortfolioInvestmentTimelineProps {
  events: TimelineEvent[]
}

const statusStyles = {
  completed: {
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    ring: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  },
  active: {
    icon: Circle,
    dot: 'bg-[#0052ff]',
    ring: 'border-blue-200 bg-blue-50 text-[#0052ff]',
  },
  pending: {
    icon: Clock,
    dot: 'bg-amber-400',
    ring: 'border-amber-200 bg-amber-50 text-amber-600',
  },
} as const

export default function PortfolioInvestmentTimeline({ events }: PortfolioInvestmentTimelineProps) {
  return (
    <div className={cn(dashboardCardClass, 'flex h-full min-h-[280px] flex-col')}>
      <h2 className={dashboardSectionTitleClass}>Investment Timeline</h2>

      {events.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No investment events yet. Start investing to build your timeline.
        </div>
      ) : (
        <ol className="mt-4 min-h-0 flex-1 space-y-0 overflow-y-auto pr-1">
          {events.map((event, index) => {
            const style = statusStyles[event.status]
            const Icon = style.icon
            const isLast = index === events.length - 1

            return (
              <li key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
                {!isLast ? (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                    style.ring
                  )}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <time className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {event.date}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{event.subtitle}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
