'use client'

import { supabase } from '@/lib/supabase'

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
    return 'Google redirect URL is not configured. Add http://localhost:3000/auth/callback (and your production URL) under Supabase → Authentication → URL Configuration → Redirect URLs.'
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

export async function signInWithGoogle(redirectTo = '/dashboard') {
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
  const callbackUrl = new URL('/auth/callback', window.location.origin)
  callbackUrl.searchParams.set('redirect', safeRedirect)

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'online',
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    throw error
  }
}
