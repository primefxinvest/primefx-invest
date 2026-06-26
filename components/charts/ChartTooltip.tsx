'use client'

type ValueType = number | string | Array<number | string>
type NameType = number | string

export type ChartTooltipPayload = {
  color?: string
  name?: NameType
  dataKey?: string | number
  value?: ValueType
  payload?: Record<string, unknown>
}

export function formatCurrency(value: ValueType) {
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `$${num.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatPercent(value: ValueType) {
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  return `${num}%`
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  label?: string | number
  valueFormatter?: (value: ValueType, name?: NameType) => string
  labelFormatter?: (label: NameType) => string
  showSeriesDot?: boolean
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter = formatCurrency,
  labelFormatter,
  showSeriesDot = true,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  const displayLabel = labelFormatter ? labelFormatter(label as NameType) : String(label ?? '')

  return (
    <div className="min-w-[140px] rounded-xl border border-gray-200/90 bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      {displayLabel ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{displayLabel}</p>
      ) : null}
      <div className="mt-2 space-y-2">
        {payload.map((entry) => {
          if (entry.value == null) return null
          const name = entry.name ?? entry.dataKey ?? 'Value'
          const formatted = valueFormatter(entry.value, name as NameType)

          return (
            <div key={`${String(entry.dataKey)}-${String(name)}`}>
              {payload.length > 1 && showSeriesDot ? (
                <div className="mb-0.5 flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: entry.color ?? '#0052ff' }}
                  />
                  <span className="text-xs font-medium text-gray-500">{String(name)}</span>
                </div>
              ) : (
                <p className="text-xs font-medium text-gray-500">{String(name)}</p>
              )}
              <p className="text-lg font-bold leading-tight text-gray-900">{formatted}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface PieTooltipContentProps {
  active?: boolean
  payload?: ChartTooltipPayload[]
  valueSuffix?: string
}

export function PieTooltipContent({
  active,
  payload,
  valueSuffix = '%',
}: PieTooltipContentProps) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  if (!entry?.name || entry.value == null) return null

  const secondary = entry.payload?.amount as string | undefined

  return (
    <div className="rounded-xl border border-gray-200/90 bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            backgroundColor: (entry.payload?.color as string | undefined) ?? entry.color ?? '#0052ff',
          }}
        />
        <p className="text-xs font-semibold text-gray-600">{String(entry.name)}</p>
      </div>
      <p className="mt-1.5 text-lg font-bold text-gray-900">
        {entry.value}
        {valueSuffix}
      </p>
      {secondary ? <p className="mt-0.5 text-xs text-gray-500">{secondary}</p> : null}
    </div>
  )
}

export {
  areaChartActiveDot,
  chartAxisStyle,
  chartGridStyle,
  chartTooltipCursor,
  chartTooltipWrapperProps,
} from '@/lib/charts/theme'
