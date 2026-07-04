export type PasswordStrength = 'weak' | 'medium' | 'strong'

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return 'weak'

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score >= 4) return 'strong'
  if (score >= 2) return 'medium'
  return 'weak'
}

export function passwordStrengthSegments(strength: PasswordStrength): number {
  if (strength === 'strong') return 4
  if (strength === 'medium') return 2
  return 1
}
