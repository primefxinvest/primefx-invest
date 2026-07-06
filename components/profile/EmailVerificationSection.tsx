'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Mail, Pencil } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { useEmailVerification } from '@/lib/auth/email-verification-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { cardSurfaceClass } from '@/lib/layout/surfaces'
import { cn } from '@/lib/utils'
import {
  DialogBackdrop,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogPopup,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogViewport,
} from '@/components/ui/dialog'

function formatSentAt(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function EmailVerificationSection() {
  const t = useTranslations('emailVerification')
  const locale = useLocale()
  const {
    email,
    verified,
    lastSentAt,
    resending,
    refreshing,
    resendCooldownSeconds,
    resendVerificationEmail,
    refreshVerificationStatus,
    requireVerifiedEmail,
  } = useEmailVerification()

  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)

  const handleChangeEmail = async () => {
    if (!requireVerifiedEmail()) return

    const trimmed = newEmail.trim()
    if (!trimmed || trimmed === email) {
      toast.error(t('changeEmailInvalid'))
      return
    }

    setChangingEmail(true)
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?redirect=/settings`
          : undefined
      const { error } = await supabase.auth.updateUser(
        { email: trimmed },
        redirectTo ? { emailRedirectTo: redirectTo } : undefined
      )

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t('changeEmailSuccess'))
      setChangeEmailOpen(false)
      setNewEmail('')
    } finally {
      setChangingEmail(false)
    }
  }

  const resendDisabled = resending || resendCooldownSeconds > 0

  return (
    <>
      <section aria-label={t('sectionTitle')} className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t('sectionTitle')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('sectionDescription')}</p>
        </div>

        <div className={cn(cardSurfaceClass, 'space-y-4 p-4 sm:p-6')}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('currentEmail')}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground">{email}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('verificationStatus')}
              </p>
              <div className="mt-2">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                    verified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  )}
                >
                  {verified ? (
                    <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : null}
                  {verified ? t('statusVerified') : t('statusPending')}
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('lastSentAt')}
              </p>
              <p className="mt-2 text-sm text-foreground">{formatSentAt(lastSentAt, locale)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            {!verified ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  onClick={() => void refreshVerificationStatus()}
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('verifyEmail')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={resendDisabled}
                  onClick={() => void resendVerificationEmail()}
                >
                  {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {resendCooldownSeconds > 0
                    ? t('resendIn', { seconds: resendCooldownSeconds })
                    : t('resendEmail')}
                </Button>
              </>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (!verified) {
                  requireVerifiedEmail()
                  return
                }
                setNewEmail(email)
                setChangeEmailOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
              {t('changeEmail')}
            </Button>
          </div>
        </div>
      </section>

      <DialogRoot open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogPortal>
          <DialogBackdrop />
          <DialogViewport>
            <DialogPopup>
              <DialogClose onClick={() => setChangeEmailOpen(false)} />
              <DialogTitle>{t('changeEmailTitle')}</DialogTitle>
              <DialogDescription>{t('changeEmailDescription')}</DialogDescription>
              <div className="mt-4">
                <label htmlFor="new-email" className="mb-1.5 block text-sm font-medium text-foreground">
                  {t('newEmail')}
                </label>
                <input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  autoComplete="email"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setChangeEmailOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="button" disabled={changingEmail} onClick={() => void handleChangeEmail()}>
                  {changingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t('saveEmail')}
                </Button>
              </DialogFooter>
            </DialogPopup>
          </DialogViewport>
        </DialogPortal>
      </DialogRoot>
    </>
  )
}
