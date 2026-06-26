'use client'

import type { ChartTooltipPayload } from '@/components/charts/ChartTooltip'
import { formatCurrency } from '@/lib/data/format'

type TooltipProps = {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string | number
}

export function formatChartMonth(label: string) {
  const [year, month] = label.split('-')
  if (!year || !month) return label
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function AdminVolumeTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null

  const deposits = Number(payload.find((p) => p.dataKey === 'deposits')?.value ?? 0)
  const withdrawals = Number(payload.find((p) => p.dataKey === 'withdrawals')?.value ?? 0)
  const net = deposits - withdrawals

  return (
    <div className="min-w-[180px] rounded-xl border border-border/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {formatChartMonth(String(label ?? ''))}
      </p>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0052ff]" />
            <span className="text-xs font-medium text-muted-foreground">Deposits</span>
          </div>
          <span className="text-sm font-bold text-foreground">{formatCurrency(deposits)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f97316]" />
            <span className="text-xs font-medium text-muted-foreground">Withdrawals</span>
          </div>
          <span className="text-sm font-bold text-foreground">{formatCurrency(withdrawals)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-muted-foreground">Net flow</span>
            <span
              className={`text-sm font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
            >
              {formatCurrency(net, { signed: true })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminTierPieTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null

  const entry = payload[0]
  const data = entry.payload as {
    name?: string
    value?: number
    percent?: number
    color?: string
  }

  return (
    <div className="min-w-[160px] rounded-xl border border-border/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: data.color ?? entry.color ?? '#0052ff' }}
        />
        <p className="text-sm font-semibold text-foreground">{data.name ?? entry.name}</p>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{data.value ?? entry.value}</p>
      <p className="text-xs text-muted-foreground">
        investors · {data.percent ?? 0}% of platform
      </p>
    </div>
  )
}

export function AdminPlanBarTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.[0]) return null

  const data = payload[0].payload as {
    name?: string
    investors?: number
    roi?: number
    share?: number
  }

  return (
    <div className="min-w-[170px] rounded-xl border border-border/80 bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
      <p className="text-sm font-semibold text-foreground">{data.name}</p>
      <p className="mt-2 text-2xl font-bold text-emerald-600">
        {(data.investors ?? 0).toLocaleString()}
      </p>
      <p className="text-xs text-muted-foreground">investors · {data.share ?? 0}% share</p>
      <p className="mt-1 text-xs font-medium text-primary">{data.roi}% weekly ROI</p>
    </div>
  )
}
