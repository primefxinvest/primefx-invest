import { formatCurrencyLabel } from './currency-options'

export function formatDepositMinimumError(currency: string, minimumUsd: number): string {
  const label = formatCurrencyLabel(currency)
  const formatted = minimumUsd.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `The minimum deposit for ${label} is ${formatted}`
}
