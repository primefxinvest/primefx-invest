import { WITHDRAW_NETWORKS_BY_ASSET, type WithdrawAssetId } from '@/lib/payments/withdraw-networks'

export function resolveWithdrawalNetworkLabel(currency: string | null | undefined): string {
  const code = String(currency ?? '').toUpperCase()
  if (!code) return '—'

  for (const networks of Object.values(WITHDRAW_NETWORKS_BY_ASSET)) {
    const match = networks.find((n) => n.apiCurrency.toUpperCase() === code)
    if (match) return match.label
  }

  if (code.includes('_')) {
    const [asset, network] = code.split('_')
    return `${asset} (${network})`
  }

  return code
}

export function estimateNetworkFeeUsd(currency: string | null | undefined): number {
  const code = String(currency ?? '').toUpperCase()
  for (const networks of Object.values(WITHDRAW_NETWORKS_BY_ASSET)) {
    const match = networks.find((n) => n.apiCurrency.toUpperCase() === code)
    if (match) return match.estimatedFeeUsd
  }
  return 0
}

export function extractTransactionHash(...sources: Array<Record<string, unknown> | null | undefined>): string | null {
  const keys = ['tx_hash', 'transaction_hash', 'hash', 'txid', 'blockchain_hash', 'payout_hash']

  for (const source of sources) {
    if (!source) continue
    for (const key of keys) {
      const value = source[key]
      if (typeof value === 'string' && value.trim().length > 0) return value.trim()
    }
  }

  return null
}

export function getBlockchainExplorerUrl(
  currency: string | null | undefined,
  txHash: string | null | undefined
): string | null {
  if (!txHash) return null
  const code = String(currency ?? '').toUpperCase()

  if (code === 'BTC') return `https://blockstream.info/tx/${txHash}`
  if (code === 'ETH' || code.includes('ERC20')) return `https://etherscan.io/tx/${txHash}`
  if (code.includes('TRC20')) return `https://tronscan.org/#/transaction/${txHash}`
  if (code.includes('BEP20') || code === 'BNB') return `https://bscscan.com/tx/${txHash}`
  if (code === 'SOL') return `https://solscan.io/tx/${txHash}`
  if (code === 'MATIC' || code.includes('POLYGON')) return `https://polygonscan.com/tx/${txHash}`

  return null
}

export function getEstimatedBlockchainCompletionLabel(status: string): string {
  const normalized = status.toLowerCase()
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'processing') return 'Typically 10–60 minutes depending on network congestion'
  if (normalized === 'approved') return 'Payout queued — awaiting blockchain broadcast'
  return '—'
}

export function resolveWithdrawalAssetId(currency: string | null | undefined): WithdrawAssetId | null {
  const code = String(currency ?? '').toUpperCase()
  if (code.startsWith('BTC')) return 'BTC'
  if (code.startsWith('ETH') || code.includes('ERC20')) return code.startsWith('USDT') ? 'USDT' : code.startsWith('USDC') ? 'USDC' : 'ETH'
  if (code.startsWith('USDT')) return 'USDT'
  if (code.startsWith('USDC')) return 'USDC'
  if (code.startsWith('BNB') || code.includes('BEP20')) return 'BNB'
  if (code.startsWith('SOL')) return 'SOL'
  if (code.startsWith('MATIC')) return 'MATIC'
  return null
}
