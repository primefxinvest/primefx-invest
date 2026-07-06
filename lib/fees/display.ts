/** UI-only fee labels — withdrawal display estimates. Transfer fee re-exports calculation config. */

import { INTERNAL_TRANSFER_FEE_USD } from '@/lib/fees/constants'

export const DISPLAY_PLATFORM_WITHDRAWAL_FEE_USD = 1.5
export const DISPLAY_INTERNAL_TRANSFER_FEE_USD = INTERNAL_TRANSFER_FEE_USD

const DISPLAY_NETWORK_FEES_USD: Record<string, number> = {
  TRC20: 1.0,
  ERC20: 1.5,
  BEP20: 1.0,
  SOL: 1.0,
}

export function getDisplayNetworkFeeUsd(networkId: string): number {
  return DISPLAY_NETWORK_FEES_USD[networkId] ?? 1.0
}

export function formatDisplayFeeUsd(amount: number): string {
  return `$${amount.toFixed(2)}`
}

export function calculateDisplayWithdrawalReceive(amountUsd: number, networkId: string) {
  const platformFeeUsd = DISPLAY_PLATFORM_WITHDRAWAL_FEE_USD
  const networkFeeUsd = getDisplayNetworkFeeUsd(networkId)
  const youWillReceiveUsd = Math.max(
    0,
    Math.round((amountUsd - platformFeeUsd - networkFeeUsd) * 100) / 100
  )
  return { platformFeeUsd, networkFeeUsd, youWillReceiveUsd }
}
