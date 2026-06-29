'use client'

import { sanitizeRedirectPath } from '@/lib/auth/session'

type AuthErrorLike = {
  message?: string
  msg?: string
  error_code?: string
  code?: number | string
}

export function formatGoogleAuthError(error: unknown): string {
  const authError = error as AuthErrorLike
  const message =
    authError?.message ??
    authError?.msg ??
    (error instanceof Error ? error.message : '') ??
    ''

  const normalized = message.toLowerCase()

  if (
    normalized.includes('provider is not enabled') ||
    normalized.includes('unsupported provider')
  ) {
    return 'Google sign-in is not enabled yet. In Supabase go to Authentication → Providers → Google, turn it on, and add your Google OAuth client ID and secret.'
  }

  if (normalized.includes('redirect') && normalized.includes('url')) {
    return 'Google redirect URL is not configured. Add https://www.primefxinvest.com/auth/callback (and http://localhost:3000/auth/callback) under Supabase → Authentication → URL Configuration → Redirect URLs.'
  }

  if (
    normalized.includes('code verifier') ||
    normalized.includes('pkce') ||
    normalized.includes('both auth code and code verifier')
  ) {
    return 'Google sign-in session expired. Close this tab, open a fresh login page, and try again without using the browser back button.'
  }

  return message || 'Google sign-in failed. Please try again or use email and password.'
}

export function isGoogleAuthEnabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'
}

/**
 * Starts Google OAuth on the server so the PKCE verifier is stored in cookies
 * (required for exchangeCodeForSession in /auth/callback).
 */
export function signInWithGoogle(redirectTo = '/dashboard') {
  const safeRedirect = sanitizeRedirectPath(redirectTo)
  const url = new URL('/auth/login/google', window.location.origin)
  url.searchParams.set('redirect', safeRedirect)
  window.location.assign(url.toString())
}
