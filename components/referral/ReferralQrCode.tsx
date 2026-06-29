'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

type ReferralQrCodeProps = {
  value: string
  label?: string
}

export function ReferralQrCode({ value, label = 'Referral QR code' }: ReferralQrCodeProps) {
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
      <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 text-xs text-gray-400">
        No link yet
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={containerRef}
        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
        aria-label={label}
      >
        <QRCode value={value} size={144} level="M" />
      </div>
      <button
        type="button"
        onClick={downloadQr}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0052ff] hover:underline"
      >
        <Download className="h-4 w-4" />
        Download QR Code
      </button>
    </div>
  )
}
