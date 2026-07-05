'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils'

const OTP_LENGTH = 6

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: boolean
  success?: boolean
  autoFocus?: boolean
  'aria-label'?: string
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  error = false,
  success = false,
  autoFocus = true,
  'aria-label': ariaLabel = 'Verification code',
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const groupId = useId()
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('')

  const focusIndex = useCallback((index: number) => {
    const el = inputRefs.current[index]
    el?.focus()
    el?.select()
  }, [])

  useEffect(() => {
    if (autoFocus && !disabled) {
      focusIndex(0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focus once on mount
  }, [autoFocus, disabled])

  const updateValue = (next: string) => {
    onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))
  }

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1)
    if (!digit) return

    const chars = value.split('')
    chars[index] = digit
    const next = chars.join('').slice(0, OTP_LENGTH)
    updateValue(next)

    if (index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index]?.trim()) {
        updateValue(value.slice(0, index) + value.slice(index + 1))
        return
      }
      if (index > 0) {
        updateValue(value.slice(0, index - 1) + value.slice(index))
        focusIndex(index - 1)
      }
      return
    }

    if (key === 'ArrowLeft' && index > 0) {
      focusIndex(index - 1)
      return
    }

    if (key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusIndex(index + 1)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    updateValue(pasted)
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1))
  }

  return (
    <div
      id={groupId}
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex justify-center gap-2 sm:gap-2.5',
        error && 'animate-[shake_0.35s_ease-in-out]',
        success && 'animate-in fade-in duration-200'
      )}
      onPaste={handlePaste}
    >
      {Array.from({ length: OTP_LENGTH }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digits[index]?.trim() ?? ''}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={cn(
            'h-12 w-10 rounded-xl border bg-background text-center text-xl font-bold tabular-nums text-foreground shadow-sm transition-all sm:h-14 sm:w-12 sm:text-2xl',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
            error
              ? 'border-destructive/60 bg-destructive/5 text-destructive'
              : success
                ? 'border-emerald-500/60 bg-emerald-50/50 text-emerald-700'
                : 'border-border hover:border-primary/40',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event.key)}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  )
}
