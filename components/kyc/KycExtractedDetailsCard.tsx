'use client'

import { Sparkles } from 'lucide-react'
import type { KycExtractedFields } from '@/lib/kyc/extract-types'
import { getIdTypeLabel } from '@/lib/kyc/upload'
import { cn } from '@/lib/utils'

interface KycExtractedDetailsCardProps {
  title: string
  data: KycExtractedFields
  onApply: () => void
  onDismiss: () => void
  applying?: boolean
  applyLabel?: string
  className?: string
}

function FieldRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value?.trim()) return null
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

export function KycExtractedDetailsCard({
  title,
  data,
  onApply,
  onDismiss,
  applying,
  applyLabel = 'Apply to form',
  className,
}: KycExtractedDetailsCardProps) {
  const hasAnyField = Boolean(
    data.fullName?.trim() ||
      data.dateOfBirth?.trim() ||
      data.address?.trim() ||
      data.idNumber?.trim() ||
      data.country?.trim()
  )

  if (!hasAnyField) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-950',
        className
      )}
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-xs text-blue-800/90">
            Read from your upload — review and correct before submitting. Confidence:{' '}
            <span className="font-semibold capitalize">{data.confidence}</span>
          </p>
          <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <FieldRow label="Full name" value={data.fullName} />
            <FieldRow label="Date of birth" value={data.dateOfBirth} />
            <FieldRow label="ID number" value={data.idNumber} />
            <FieldRow label="Country" value={data.country} />
            {data.idType ? (
              <FieldRow label="ID type" value={getIdTypeLabel(data.idType)} />
            ) : null}
            <FieldRow label="Address" value={data.address} />
          </dl>
          {data.notes?.trim() ? (
            <p className="mt-2 text-xs text-blue-800/80">{data.notes}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApply}
              disabled={applying}
              className="rounded-lg bg-[#0052ff] px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {applying ? 'Applying…' : applyLabel}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              disabled={applying}
              className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-900 hover:bg-blue-50 disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
