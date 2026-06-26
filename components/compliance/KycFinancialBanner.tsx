'use client'

import Link from 'next/link'
import { AlertCircle, ShieldAlert } from 'lucide-react'
import { useFinancialKycAccess } from '@/lib/hooks/useFinancialKycAccess'
import { cn } from '@/lib/utils'

export function KycFinancialBanner({ className }: { className?: string }) {
  const { loading, verified, status, summary } = useFinancialKycAccess()

  if (loading || verified || !summary) return null

  const isRejected = status === 'rejected'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        isRejected
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-amber-200 bg-amber-50 text-amber-900',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {isRejected ? (
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {isRejected ? 'KYC verification rejected' : 'KYC verification required'}
          </p>
          <p className="mt-0.5 text-sm opacity-90">{summary}</p>
        </div>
      </div>
      <Link
        href="/profile"
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
          isRejected
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-amber-600 text-white hover:bg-amber-700'
        )}
      >
        View profile
      </Link>
    </div>
  )
}
