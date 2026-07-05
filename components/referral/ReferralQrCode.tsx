'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type ReferralQrCodeProps = {
  value: string
  label?: string
  size?: number
  compact?: boolean
  className?: string
  onShare?: () => void
}

export function ReferralQrCode({
  value,
  label = 'Referral QR code',
  size = 144,
  compact = false,
  className,
  onShare,
}: ReferralQrCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const downloadQr = () => {
    if (!value || !containerRef.current) return

    const svg = containerRef.current.querySelector('svg')
    if (!svg) {
      toast.error('QR code is not ready yet')
      return
    }

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(svg)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'primefx-referral-qr.svg'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('QR code downloaded')
  }

  if (!value) {
    return (
      <div
        className={cn(
          'mx-auto flex items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-xs text-muted-foreground',
          compact ? 'h-28 w-28' : 'h-36 w-36',
          className
        )}
      >
        No link yet
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        ref={containerRef}
        className={cn(
          'rounded-xl border border-border bg-white shadow-sm',
          compact ? 'p-2' : 'p-3'
        )}
        aria-label={label}
      >
        <QRCode value={value} size={size} level="M" />
      </div>
      <div className={cn('flex flex-wrap items-center justify-center gap-2', compact ? 'mt-2' : 'mt-3')}>
        <button
          type="button"
          onClick={downloadQr}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[11px] font-semibold text-foreground transition-colors hover:bg-muted sm:text-xs"
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          Download
        </button>
        {onShare ? (
          <button
            type="button"
            onClick={onShare}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:text-xs"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden />
            Share
          </button>
        ) : null}
      </div>
    </div>
  )
}
