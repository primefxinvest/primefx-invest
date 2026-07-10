import { describe, expect, it } from 'vitest'
import { ensureErrorMessage, mapSignupErrorMessage } from '@/lib/auth/signup-errors'
import { isEmailVerified } from '@/lib/auth/require-verified-email'

describe('registration email verification', () => {
  it('treats unverified users as not verified', () => {
    expect(isEmailVerified({ email_confirmed_at: undefined })).toBe(false)
  })

  it('treats confirmed users as verified', () => {
    expect(isEmailVerified({ email_confirmed_at: '2026-01-01T00:00:00Z' })).toBe(true)
  })
})

describe('signup error mapping', () => {
  it('never renders empty object as the message', () => {
    expect(ensureErrorMessage({})).not.toBe('{}')
    expect(ensureErrorMessage('{}')).not.toBe('{}')
    expect(ensureErrorMessage({ error: {} })).not.toBe('{}')
  })

  it('maps duplicate email errors', () => {
    expect(mapSignupErrorMessage('User already registered')).toContain('already exists')
  })

  it('maps weak password errors', () => {
    expect(mapSignupErrorMessage('Password should be at least 6 characters')).toContain('weak')
  })

  it('maps rate limit errors', () => {
    expect(mapSignupErrorMessage('email rate limit exceeded')).toContain('Too many')
  })
})
