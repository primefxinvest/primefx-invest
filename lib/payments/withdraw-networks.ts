/** UI-layer asset & network catalog for crypto withdrawals. Maps to existing payout currency codes. */

export type WithdrawAssetId = 'BTC' | 'ETH' | 'USDT' | 'USDC' | 'BNB' | 'SOL' | 'MATIC'

export type WithdrawNetworkOption = {
  id: string
  label: string
  shortLabel: string
  badge: string
  apiCurrency: string
  estimatedFeeUsd: number
  addressPattern: RegExp
}

export type WithdrawAssetOption = {
  id: WithdrawAssetId
  name: string
  symbol: string
  color: string
}

export const WITHDRAW_ASSETS: WithdrawAssetOption[] = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', color: '#F7931A' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', color: '#26A17B' },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', color: '#2775CA' },
  { id: 'BNB', name: 'BNB', symbol: 'BNB', color: '#F3BA2F' },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'MATIC', name: 'Polygon', symbol: 'MATIC', color: '#8247E5' },
]

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const BTC_ADDRESS = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/
const TRON_ADDRESS = /^T[1-9A-HJ-NP-Za-km-z]{33}$/
const SOL_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const WITHDRAW_NETWORKS_BY_ASSET: Record<WithdrawAssetId, WithdrawNetworkOption[]> = {
  BTC: [
    {
      id: 'BTC',
      label: 'Bitcoin (BTC)',
      shortLabel: 'BTC',
      badge: 'BTC',
      apiCurrency: 'BTC',
      estimatedFeeUsd: 2.5,
      addressPattern: BTC_ADDRESS,
    },
  ],
  ETH: [
    {
      id: 'ERC20',
      label: 'Ethereum (ERC20)',
      shortLabel: 'ERC20',
      badge: 'ERC20',
      apiCurrency: 'ETH',
      estimatedFeeUsd: 4.0,
      addressPattern: EVM_ADDRESS,
    },
  ],
  USDT: [
    {
      id: 'TRC20',
      label: 'Tron (TRC20)',
      shortLabel: 'TRC20',
      badge: 'TRC20',
      apiCurrency: 'USDT_TRC20',
      estimatedFeeUsd: 1.0,
      addressPattern: TRON_ADDRESS,
    },
    {
      id: 'ERC20',
      label: 'Ethereum (ERC20)',
      shortLabel: 'ERC20',
      badge: 'ERC20',
      apiCurrency: 'USDT_ERC20',
      estimatedFeeUsd: 5.0,
      addressPattern: EVM_ADDRESS,
    },
    {
      id: 'BEP20',
      label: 'BNB Smart Chain (BEP20)',
      shortLabel: 'BEP20',
      badge: 'BEP20',
      apiCurrency: 'USDT_ERC20',
      estimatedFeeUsd: 0.8,
      addressPattern: EVM_ADDRESS,
    },
  ],
  USDC: [
    {
      id: 'ERC20',
      label: 'Ethereum (ERC20)',
      shortLabel: 'ERC20',
      badge: 'ERC20',
      apiCurrency: 'USDC',
      estimatedFeeUsd: 4.5,
      addressPattern: EVM_ADDRESS,
    },
    {
      id: 'BEP20',
      label: 'BNB Smart Chain (BEP20)',
      shortLabel: 'BEP20',
      badge: 'BEP20',
      apiCurrency: 'USDC',
      estimatedFeeUsd: 0.8,
      addressPattern: EVM_ADDRESS,
    },
  ],
  BNB: [
    {
      id: 'BEP20',
      label: 'BNB Smart Chain (BEP20)',
      shortLabel: 'BEP20',
      badge: 'BEP20',
      apiCurrency: 'BNB',
      estimatedFeeUsd: 0.35,
      addressPattern: EVM_ADDRESS,
    },
  ],
  SOL: [
    {
      id: 'SOL',
      label: 'Solana (SOL)',
      shortLabel: 'SOL',
      badge: 'SOL',
      apiCurrency: 'SOL',
      estimatedFeeUsd: 0.25,
      addressPattern: SOL_ADDRESS,
    },
  ],
  MATIC: [
    {
      id: 'POLYGON',
      label: 'Polygon',
      shortLabel: 'Polygon',
      badge: 'MATIC',
      apiCurrency: 'MATIC',
      estimatedFeeUsd: 0.15,
      addressPattern: EVM_ADDRESS,
    },
  ],
}

export function getNetworksForAsset(
  assetId: WithdrawAssetId,
  availableApiCurrencies: string[]
): WithdrawNetworkOption[] {
  const allowed = new Set(availableApiCurrencies.map((c) => c.toUpperCase()))
  const seen = new Set<string>()

  return (WITHDRAW_NETWORKS_BY_ASSET[assetId] ?? []).filter((network) => {
    if (!allowed.has(network.apiCurrency.toUpperCase())) return false
    const key = `${network.id}:${network.apiCurrency}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function validateWithdrawAddress(
  address: string,
  network: WithdrawNetworkOption | null
): { valid: boolean; touched: boolean } {
  const trimmed = address.trim()
  if (!trimmed || !network) return { valid: false, touched: trimmed.length > 0 }
  return { valid: network.addressPattern.test(trimmed), touched: true }
}

export function resolveApiCurrency(
  assetId: WithdrawAssetId,
  networkId: string,
  availableApiCurrencies: string[]
): string | null {
  const network = getNetworksForAsset(assetId, availableApiCurrencies).find((n) => n.id === networkId)
  return network?.apiCurrency ?? null
}
