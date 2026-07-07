'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { resolveAssetLogo } from '@/lib/market/asset-metadata'

type MarketAssetLogoProps = {
  symbol: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
} as const

export default function MarketAssetLogo({
  symbol,
  name,
  size = 'md',
  className,
}: MarketAssetLogoProps) {
  const [failed, setFailed] = useState(false)
  const logo = resolveAssetLogo(symbol)
  const initials = symbol.replace(/[^A-Z0-9]/gi, '').slice(0, 3).toUpperCase()

  if (logo && !failed) {
    return (
      <span
        className={cn(
          'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5',
          SIZE[size],
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`${name} logo`}
          className="h-full w-full object-contain p-1"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-indigo-600 text-[10px] font-bold text-white shadow-sm',
        SIZE[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  )
}
