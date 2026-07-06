'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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

type EmailVerificationRequiredModalProps = {
  open: boolean
  onClose: () => void
  onResend: () => Promise<boolean>
  onRefresh: () => Promise<boolean>
  resending: boolean
  refreshing: boolean
  resendCooldownSeconds: number
}

export function EmailVerificationRequiredModal({
  open,
  onClose,
  onResend,
  onRefresh,
  resending,
  refreshing,
  resendCooldownSeconds,
}: EmailVerificationRequiredModalProps) {
  const t = useTranslations('emailVerification')

  if (!open) return null

  const resendDisabled = resending || resendCooldownSeconds > 0

  return (
    <DialogRoot open onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogPortal>
        <DialogBackdrop />
        <DialogViewport>
          <DialogPopup>
            <DialogClose onClick={onClose} />
            <DialogTitle>{t('modalTitle')}</DialogTitle>
            <DialogDescription>{t('modalDescription')}</DialogDescription>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={refreshing}
                onClick={() => void onRefresh()}
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t('verifyEmail')}
              </Button>
              <Button
                type="button"
                disabled={resendDisabled}
                onClick={() => void onResend()}
              >
                {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {resendCooldownSeconds > 0
                  ? t('resendIn', { seconds: resendCooldownSeconds })
                  : t('resendEmail')}
              </Button>
            </DialogFooter>
          </DialogPopup>
        </DialogViewport>
      </DialogPortal>
    </DialogRoot>
  )
}
