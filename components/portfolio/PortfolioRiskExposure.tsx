'use client'

import { Shield } from 'lucide-react'
import { dashboardCardClass, dashboardSectionTitleClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'

type RiskBucket = {
  label: string
  count: number
  percentage: number
  color: string
}

interface PortfolioRiskExposureProps {
  buckets: RiskBucket[]
  overallLabel: string
}

export default function PortfolioRiskExposure({
  buckets,
  overallLabel,
}: PortfolioRiskExposureProps) {
  return (
    <div className={cn(dashboardCardClass, 'flex h-full min-h-[280px] flex-col')}>
      <div className="flex items-start justify-between gap-3">
        <h2 className={dashboardSectionTitleClass}>Risk Exposure Analysis</h2>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0052ff]">
          <Shield className="h-4 w-4" aria-hidden />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Overall profile
        </p>
        <p className="mt-0.5 text-sm font-bold text-foreground">{overallLabel}</p>
      </div>

      {buckets.length === 0 ? (
        <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          No active positions to analyze.
        </div>
      ) : (
        <ul className="mt-4 flex-1 space-y-3">
          {buckets.map((bucket) => (
            <li key={bucket.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{bucket.label}</span>
                <span className="text-muted-foreground">
                  {bucket.count} plan{bucket.count !== 1 ? 's' : ''} · {bucket.percentage}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
