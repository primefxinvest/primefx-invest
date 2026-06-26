'use client'

import { useEffect, useState } from 'react'
import { getCurrentUser } from '@/lib/supabase'

export interface AuthEntryState {
  loading: boolean
  isAuthenticated: boolean
  dashboardHref: string
  loginHref: string
  loginLabel: string
  signupHref: string
  signupLabel: string
}

const GUEST_STATE: Omit<AuthEntryState, 'loading' | 'isAuthenticated'> = {
  dashboardHref: '/dashboard',
  loginHref: '/login',
  loginLabel: 'Log In',
  signupHref: '/signup',
  signupLabel: 'Get Started',
}

export function useAuthEntry(): AuthEntryState {
  const [state, setState] = useState<AuthEntryState>({
    loading: true,
    isAuthenticated: false,
    ...GUEST_STATE,
  })

  useEffect(() => {
    let active = true

    async function resolve() {
      try {
        const result = await Promise.race([
          getCurrentUser(),
          new Promise<{ data: null; error: Error }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error('timeout') }), 10_000)
          ),
        ])
        if (!active) return

        const { data: user, error } = result
        const isAuthenticated = Boolean(user && !error)
        setState({
          loading: false,
          isAuthenticated,
          ...GUEST_STATE,
        })
      } catch {
        if (active) {
          setState({
            loading: false,
            isAuthenticated: false,
            ...GUEST_STATE,
          })
        }
      }
    }

    resolve()

    return () => {
      active = false
    }
  }, [])

  return state
}
