'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Shield } from 'lucide-react'
import TwoFactorModal from '@/components/settings/TwoFactorModal'
import { getMfaStatus, type MfaStatus } from '@/lib/auth/mfa'
import { getCurrentUser } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export function AdminSecurityCard() {
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>({ enabled: false, provider: null })
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    const { data: user } = await getCurrentUser()
    setUserEmail(user?.email ?? '')
    const status = await getMfaStatus()
    setMfaStatus(status)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadStatus()
    window.addEventListener('primefx:profile-updated', loadStatus)
    return () => window.removeEventListener('primefx:profile-updated', loadStatus)
  }, [loadStatus])

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Admin account security
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Protect your admin session with two-factor authentication. Required for sensitive
              platform operations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            {mfaStatus.enabled ? 'Manage 2FA' : 'Enable 2FA'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <span className="text-sm text-muted-foreground">Signed in as</span>
          <span className="text-sm font-medium text-foreground">{userEmail || '—'}</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                mfaStatus.enabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-800'
              )}
            >
              {mfaStatus.enabled
                ? `2FA active${mfaStatus.provider ? ` (${mfaStatus.provider})` : ''}`
                : '2FA not enabled'}
            </span>
          )}
        </div>

        {!loading && !mfaStatus.enabled ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Enable an authenticator app before approving withdrawals, resetting user 2FA, or changing
            critical platform settings.
          </p>
        ) : null}
      </section>

      <TwoFactorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userEmail={userEmail}
        initialEnabled={mfaStatus.enabled}
        onStatusChange={(status) => {
          setMfaStatus(status)
          loadStatus()
        }}
      />
    </>
  )
}
