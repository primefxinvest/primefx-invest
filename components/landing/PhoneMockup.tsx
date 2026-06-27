'use client'

import IPhoneMockup from '@/components/ui/iphone-mockup'
import { cn } from '@/lib/utils'

function MiniChart() {
  return (
    <svg viewBox="0 0 160 48" className="mt-1 h-10 w-full sm:h-12" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="phoneChartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 38 L20 34 L40 36 L60 28 L80 30 L100 22 L120 24 L140 16 L160 12 L160 48 L0 48 Z"
        fill="url(#phoneChartFill)"
      />
      <path
        d="M0 38 L20 34 L40 36 L60 28 L80 30 L100 22 L120 24 L140 16 L160 12"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const assets = [
  { name: 'NASDAQ', change: '+1.24%', up: true },
  { name: 'GOLD', change: '+0.87%', up: true },
  { name: 'EUR/USD', change: '-0.32%', up: false },
]

interface PhoneMockupProps {
  className?: string
  /** Show only the top portion of the device (cropped at bottom) */
  half?: boolean
}

export default function PhoneMockup({ className, half = false }: PhoneMockupProps) {
  const phone = (
    <div
      className={cn('relative shrink-0', !half && className)}
      style={
        half
          ? undefined
          : { transform: 'perspective(900px) rotateY(-10deg) rotateX(3deg)' }
      }
    >
      <IPhoneMockup compact={half}>
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0052ff]">
            <span className="text-[9px] font-bold text-white">P</span>
          </div>
          <span className="text-[10px] font-semibold text-white">PrimeFx</span>
        </div>

        <p className="text-[9px] text-blue-300/70">Portfolio Balance</p>
        <p className="text-lg font-bold text-white sm:text-xl">$24,567.89</p>
        <p className="text-[10px] font-semibold text-emerald-400">↑ +22.81%</p>

        <MiniChart />

        <p className="mb-1.5 mt-2 text-[9px] font-medium text-blue-300/70">Your Assets</p>
        <div className="space-y-1.5">
          {assets.map((asset) => (
            <div
              key={asset.name}
              className="flex items-center justify-between rounded-lg bg-white/5 px-2 py-1.5"
            >
              <span className="text-[9px] font-medium text-white/90">{asset.name}</span>
              <span
                className={cn(
                  'text-[9px] font-bold',
                  asset.up ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {asset.change}
              </span>
            </div>
          ))}
        </div>
      </IPhoneMockup>
    </div>
  )

  if (!half) {
    return phone
  }

  return (
    <div
      className={cn(
        'relative mx-auto w-full max-w-[240px] overflow-hidden md:mx-0 md:max-w-none',
        className
      )}
      style={{ height: 'min(100%, 300px)', maxHeight: '300px' }}
    >
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0">
        <div
          style={{ transform: 'perspective(900px) rotateY(-10deg) rotateX(3deg) translateY(38%)' }}
        >
          {phone}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-blue-50/90 to-transparent" />
    </div>
  )
}
