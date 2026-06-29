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
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium text-slate-500 sm:text-[13px]">{label}</p>
          <p className={`mt-1 text-lg font-semibold leading-none tracking-tight sm:mt-1.5 sm:text-[26px] ${valueClass}`}>
            {value}
          </p>
          <p className="mt-1 line-clamp-2 text-[10px] text-slate-400 sm:mt-2 sm:text-xs">{subtext}</p>
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-11 sm:w-11 sm:rounded-xl ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
