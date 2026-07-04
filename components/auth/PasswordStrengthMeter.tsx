'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  getPasswordStrength,
  passwordStrengthSegments,
  type PasswordStrength,
} from '@/lib/auth/password-strength'

type PasswordStrengthMeterProps = {
  password: string
}

const strengthColor: Record<PasswordStrength, string> = {
  weak: 'bg-destructive',
  medium: 'bg-amber-500',
  strong: 'bg-emerald-500',
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const t = useTranslations('auth')

  if (!password) return null

  const strength = getPasswordStrength(password)
  const filled = passwordStrengthSegments(strength)
  const labelKey =
    strength === 'strong'
      ? 'passwordStrengthStrong'
      : strength === 'medium'
        ? 'passwordStrengthMedium'
        : 'passwordStrengthWeak'

  return (
    <div className="mt-2 space-y-1.5" aria-live="polite">
      <p className="text-xs text-muted-foreground">
        {t('passwordStrengthLabel')}{' '}
        <span
          className={cn(
            'font-semibold',
            strength === 'strong' && 'text-emerald-600',
            strength === 'medium' && 'text-amber-600',
            strength === 'weak' && 'text-destructive'
          )}
        >
          {t(labelKey)}
        </span>
      </p>
      <div className="flex gap-1" role="progressbar" aria-valuenow={filled} aria-valuemin={0} aria-valuemax={4}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full bg-border transition-colors',
              index < filled && strengthColor[strength]
            )}
          />
        ))}
      </div>
    </div>
  )
}
