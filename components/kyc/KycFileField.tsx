'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, FileUp, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateKycFile } from '@/lib/kyc/upload'

interface KycFileFieldProps {
  label: string
  hint?: string
  required?: boolean
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  scanning?: boolean
}

export function KycFileField({
  label,
  hint,
  required,
  value,
  onChange,
  disabled,
  scanning,
}: KycFileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File | null) => {
    if (!file) {
      onChange(null)
      setError(null)
      return
    }
    const validationError = validateKycFile(file)
    if (validationError) {
      setError(validationError)
      onChange(null)
      return
    }
    setError(null)
    onChange(file)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        {value ? (
          <button
            type="button"
            disabled={disabled || scanning}
            onClick={() => handleFile(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <button
        type="button"
        disabled={disabled || scanning}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
          value ? 'border-emerald-300 bg-emerald-50/50' : 'border-border hover:border-primary/40 hover:bg-secondary/40',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className="flex items-center gap-2 text-sm">
          {value ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className={value ? 'font-medium text-foreground' : 'text-muted-foreground'}>
            {value ? value.name : 'Choose file (JPG, PNG, WebP, or PDF)'}
          </span>
        </span>
        {scanning ? (
          <span className="flex items-center gap-1.5 text-xs text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning…
          </span>
        ) : disabled ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        disabled={disabled || scanning}
        onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
