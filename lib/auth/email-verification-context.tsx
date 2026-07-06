'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { supabase } from '@/lib/supabase'
import type { EmailVerificationStatus } from '@/lib/auth/email-verification-types'
import {
  refreshEmailVerificationAction,
  resendVerificationEmailAction,
} from '@/lib/auth/email-verification-actions'
import { EmailVerificationRequiredModal } from '@/components/auth/EmailVerificationRequiredModal'

type EmailVerificationContextValue = {
  email: string
  verified: boolean
  lastSentAt: string | null
  resendCooldownSeconds: number
  resending: boolean
  refreshing: boolean
  resendVerificationEmail: () => Promise<boolean>
  refreshVerificationStatus: () => Promise<boolean>
  requireVerifiedEmail: () => boolean
  openVerificationModal: () => void
}

const EmailVerificationContext = createContext<EmailVerificationContextValue | null>(null)

type EmailVerificationProviderProps = {
  children: ReactNode
  initialStatus: EmailVerificationStatus
}

export function EmailVerificationProvider({
  children,
  initialStatus,
}: EmailVerificationProviderProps) {
  const t = useTranslations('emailVerification')
  const [status, setStatus] = useState(initialStatus)
  const [modalOpen, setModalOpen] = useState(false)
  const [resending, setResending] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(initialStatus.resendCooldownSeconds)

  useEffect(() => {
    setStatus(initialStatus)
    setCooldownSeconds(initialStatus.resendCooldownSeconds)
  }, [initialStatus])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timer = window.setInterval(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldownSeconds])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        const verified = Boolean(session?.user?.email_confirmed_at)
        setStatus((current) => ({
          ...current,
          email: session?.user?.email ?? current.email,
          verified,
        }))
        if (verified) {
          setModalOpen(false)
          window.dispatchEvent(new CustomEvent('primefx:email-verified'))
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const applyStatus = useCallback((next: EmailVerificationStatus | null) => {
    if (!next) return false
    setStatus(next)
    setCooldownSeconds(next.resendCooldownSeconds)
    return next.verified
  }, [])

  const refreshVerificationStatus = useCallback(async () => {
    setRefreshing(true)
    try {
      const next = await refreshEmailVerificationAction()
      const verified = applyStatus(next)
      if (verified) {
        toast.success(t('verifiedSuccess'))
      }
      return Boolean(verified)
    } finally {
      setRefreshing(false)
    }
  }, [applyStatus, t])

  const resendVerificationEmail = useCallback(async () => {
    if (status.verified) {
      toast.info(t('alreadyVerified'))
      return true
    }

    if (cooldownSeconds > 0) {
      toast.error(t('resendCooldown', { seconds: cooldownSeconds }))
      return false
    }

    setResending(true)
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : undefined
      const result = await resendVerificationEmailAction(origin)

      if (!result.success) {
        if (result.code === 'ALREADY_VERIFIED') {
          await refreshVerificationStatus()
          return true
        }
        if (result.retryAfterSeconds) {
          setCooldownSeconds(result.retryAfterSeconds)
        }
        toast.error(result.error)
        return false
      }

      const next = await refreshEmailVerificationAction()
      applyStatus(next)
      setCooldownSeconds(60)
      toast.success(t('resendSuccess'))
      return true
    } finally {
      setResending(false)
    }
  }, [applyStatus, cooldownSeconds, refreshVerificationStatus, status.verified, t])

  const requireVerifiedEmail = useCallback(() => {
    if (status.verified) return true
    setModalOpen(true)
    return false
  }, [status.verified])

  const openVerificationModal = useCallback(() => {
    setModalOpen(true)
  }, [])

  const value = useMemo<EmailVerificationContextValue>(
    () => ({
      email: status.email,
      verified: status.verified,
      lastSentAt: status.lastSentAt,
      resendCooldownSeconds: cooldownSeconds,
      resending,
      refreshing,
      resendVerificationEmail,
      refreshVerificationStatus,
      requireVerifiedEmail,
      openVerificationModal,
    }),
    [
      status.email,
      status.verified,
      status.lastSentAt,
      cooldownSeconds,
      resending,
      refreshing,
      resendVerificationEmail,
      refreshVerificationStatus,
      requireVerifiedEmail,
      openVerificationModal,
    ]
  )

  return (
    <EmailVerificationContext.Provider value={value}>
      {children}
      <EmailVerificationRequiredModal
        open={modalOpen && !status.verified}
        onClose={() => setModalOpen(false)}
        onResend={resendVerificationEmail}
        onRefresh={refreshVerificationStatus}
        resending={resending}
        refreshing={refreshing}
        resendCooldownSeconds={cooldownSeconds}
      />
    </EmailVerificationContext.Provider>
  )
}

export function useEmailVerification() {
  const context = useContext(EmailVerificationContext)
  if (!context) {
    throw new Error('useEmailVerification must be used within EmailVerificationProvider')
  }
  return context
}

export function useOptionalEmailVerification() {
  return useContext(EmailVerificationContext)
}
