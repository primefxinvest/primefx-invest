import type { FinancialAction } from '@/lib/investor/kyc'
import { isKycVerified, normalizeKycStatus } from '@/lib/investor/kyc'

type ComplianceTranslator = (key: string, values?: Record<string, string>) => string

const ACTION_I18N_KEYS: Record<FinancialAction, string> = {
  deposit: 'kycActionDeposit',
  withdrawal: 'kycActionWithdrawal',
  investment: 'kycActionInvestment',
  transfer: 'kycActionTransfer',
  convert: 'kycActionConvert',
  payment: 'kycActionPayment',
}

const FALLBACK_I18N_KEYS: Record<FinancialAction, string> = {
  deposit: 'kycDepositRequired',
  withdrawal: 'kycWithdrawRequired',
  investment: 'kycInvestmentRequired',
  transfer: 'kycTransferRequired',
  convert: 'kycToastFallback',
  payment: 'kycToastFallback',
}

export function kycBlockReason(
  t: ComplianceTranslator,
  status: string | null | undefined,
  action: FinancialAction
): string | null {
  if (isKycVerified(status)) return null

  const normalized = normalizeKycStatus(status)
  const actionLabel = t(ACTION_I18N_KEYS[action])

  if (normalized === 'rejected') {
    return t('kycBlockRejected', { action: actionLabel })
  }

  return t('kycBlockRequired', { action: actionLabel })
}

export function kycFallbackMessage(t: ComplianceTranslator, action: FinancialAction) {
  return t(FALLBACK_I18N_KEYS[action])
}
