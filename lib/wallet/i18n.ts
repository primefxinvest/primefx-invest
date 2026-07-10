type WalletTranslator = (key: string) => string

const TX_TYPE_KEYS: Record<string, string> = {
  Deposit: 'deposit',
  Withdrawal: 'withdrawal',
  Transfer: 'transfer',
  Bonus: 'bonus',
  Profit: 'profit',
  Investment: 'investment',
}

const TX_STATUS_KEYS: Record<string, string> = {
  completed: 'completed',
  completed_partial: 'completedPartial',
  pending: 'pending',
  processing: 'processing',
  failed: 'failed',
  cancelled: 'cancelled',
  rejected: 'rejected',
}

export function walletTxTypeLabel(t: WalletTranslator, type: string) {
  const id = TX_TYPE_KEYS[type]
  return id ? t(`txType.${id}`) : type
}

export function walletTxStatusLabel(t: WalletTranslator, status: string) {
  const id = TX_STATUS_KEYS[status.toLowerCase()]
  return id ? t(`txStatus.${id}`) : status
}
