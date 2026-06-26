'use client'

import { ReactNode } from 'react'

interface SummaryCardProps {
  label: string
  value: string
  subtext: string
  icon: ReactNode
  iconClass: string
  valueClass?: string
}

export function SummaryCard({
  label,
  value,
  subtext,
  icon,
  iconClass,
  valueClass = 'text-slate-900',
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-slate-500">{label}</p>
          <p className={`mt-1.5 text-[26px] font-semibold leading-none tracking-tight ${valueClass}`}>
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{subtext}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
