'use client'

export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-24 bg-muted rounded mb-3" />
      <div className="h-8 w-32 bg-muted rounded" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
      <div className="h-4 w-40 bg-muted rounded mb-4" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card animate-pulse">
      <div className="p-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-4">
            <div className="flex-1 h-10 bg-muted rounded" />
            <div className="flex-1 h-10 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
