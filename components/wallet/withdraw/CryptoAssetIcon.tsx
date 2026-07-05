'use client'

import { cn } from '@/lib/utils'
import type { WithdrawAssetId } from '@/lib/payments/withdraw-networks'
import { WITHDRAW_ASSETS } from '@/lib/payments/withdraw-networks'

type CryptoAssetIconProps = {
  assetId: WithdrawAssetId | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASS = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
} as const

export function CryptoAssetIcon({ assetId, size = 'md', className }: CryptoAssetIconProps) {
  const asset = WITHDRAW_ASSETS.find((item) => item.id === assetId)
  const symbol = asset?.symbol ?? String(assetId).slice(0, 3)
  const color = asset?.color ?? '#0052ff'

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm',
        SIZE_CLASS[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {symbol.slice(0, symbol.length > 4 ? 3 : symbol.length)}
    </span>
  )
}

export function NetworkBadge({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600',
        className
      )}
    >
      {label}
    </span>
  )
}
