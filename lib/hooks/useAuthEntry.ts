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
      const { data: user, error } = await getCurrentUser()
      if (!active) return

      const isAuthenticated = Boolean(user && !error)
      setState({
        loading: false,
        isAuthenticated,
        ...GUEST_STATE,
      })
    }

    resolve()

    return () => {
      active = false
    }
  }, [])

  return state
}
