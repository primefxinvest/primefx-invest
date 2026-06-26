import { toast } from 'sonner'
import { getKycBlockReason, type FinancialAction } from '@/lib/investor/kyc'

const KYC_TOAST_ID = 'kyc-verification-required'

export function showKycRequiredToast({
  status,
  action,
  fallback,
  actionButton,
}: {
  status: string | null | undefined
  action: FinancialAction
  fallback?: string
  actionButton?: { label: string; onClick: () => void }
}) {
  toast.error('KYC verification required', {
    id: KYC_TOAST_ID,
    description:
      getKycBlockReason(status, action) ??
      fallback ??
      'Complete KYC verification and wait for approval.',
    action: actionButton,
  })
}
