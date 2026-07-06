import { PLATFORM_FEE_RATES, WITHDRAWAL_NOTICE_DAYS } from '@/lib/referral/program-config'

export { PLATFORM_FEE_RATES, WITHDRAWAL_NOTICE_DAYS }

/** Fixed internal transfer fee (USD) — single source of truth for calculations and UI. */
export const INTERNAL_TRANSFER_FEE_USD = 1.2

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateP2pTransferFee(recipientAmount: number) {
  const amount = roundMoney(recipientAmount)
  const fee = INTERNAL_TRANSFER_FEE_USD
  return {
    recipientAmount: amount,
    fee,
    senderTotal: roundMoney(amount + fee),
  }
}

export function calculateWithdrawalFee(grossAmount: number) {
  const amount = roundMoney(grossAmount)
  const fee = roundMoney(amount * PLATFORM_FEE_RATES.withdrawal)
  return {
    grossAmount: amount,
    fee,
    netAmount: roundMoney(amount - fee),
  }
}

export function getWithdrawalAvailableDate(from = new Date()): Date {
  const available = new Date(from)
  available.setDate(available.getDate() + WITHDRAWAL_NOTICE_DAYS)
  return available
}
