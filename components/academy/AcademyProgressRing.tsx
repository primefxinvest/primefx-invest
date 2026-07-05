'use client'

import { cn } from '@/lib/utils'

type AcademyProgressRingProps = {
  percent: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
  trackClassName?: string
  progressClassName?: string
}

export function AcademyProgressRing({
  percent,
  size = 52,
  strokeWidth = 5,
  label,
  className,
  trackClassName = 'stroke-gray-100',
  progressClassName = 'stroke-[#0052ff]',
}: AcademyProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, percent))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={cn('relative shrink-0', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={trackClassName}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(progressClassName, 'transition-[stroke-dashoffset] duration-700 ease-out')}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-bold tabular-nums text-foreground sm:text-xs">
          {Math.round(clamped)}%
        </span>
      </div>
    </div>
  )
}
