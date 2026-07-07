import type { MarketItem } from '@/lib/data/types'
import { categorizeMarketAsset, parseChangePercent, type MarketCategory } from '@/lib/market/categories'

export type MarketFilter = 'all' | MarketCategory | 'favorites' | 'stocks' | 'indices'

export type EnrichedMarketItem = MarketItem & {
  name: string
  ticker: string
  category: MarketCategory | 'stocks' | 'indices'
  changePercent: number
  priceValue: number
  high24h: string
  low24h: string
  volume: string
  marketCap: string | null
  marketStatus: 'open' | 'closed'
  volatility: 'high' | 'low'
}

const ASSET_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  SOL: 'Solana',
  XRP: 'XRP',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  TON: 'Toncoin',
  AVAX: 'Avalanche',
  LINK: 'Chainlink',
  GOLD: 'Gold',
  SILVER: 'Silver',
  XAU: 'Gold',
  OIL: 'Crude Oil',
  WTI: 'Crude Oil',
  NASDAQ: 'NASDAQ Composite',
  SPX: 'S&P 500',
  'S&P500': 'S&P 500',
  'EUR/USD': 'Euro / US Dollar',
  'GBP/USD': 'British Pound / US Dollar',
  'USD/JPY': 'US Dollar / Japanese Yen',
}

/** Official-style logos via trusted CDNs (crypto-icons, CoinGecko assets). */
export const ASSET_LOGOS: Record<string, string> = {
  BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  GOLD: 'https://assets.coingecko.com/coins/images/10481/small/Tether_Gold.png',
  SILVER: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Silver_symbol.svg/120px-Silver_symbol.svg.png',
  XAU: 'https://assets.coingecko.com/coins/images/10481/small/Tether_Gold.png',
  OIL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Oil_well_icon.svg/120px-Oil_well_icon.svg.png',
  WTI: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Oil_well_icon.svg/120px-Oil_well_icon.svg.png',
  NASDAQ: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Nasdaq_logo.svg/120px-Nasdaq_logo.svg.png',
  SPX: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/S%26P_500_Index_logo.svg/120px-S%26P_500_Index_logo.svg.png',
  'S&P500': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/S%26P_500_Index_logo.svg/120px-S%26P_500_Index_logo.svg.png',
  'EUR/USD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/120px-Flag_of_Europe.svg.png',
  'GBP/USD': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ae/Flag_of_the_United_Kingdom.svg/120px-Flag_of_the_United_Kingdom.svg.png',
  'USD/JPY': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Flag_of_the_United_States.svg/120px-Flag_of_the_United_States.svg.png',
}

function extractTicker(symbol: string): string {
  const upper = symbol.toUpperCase().trim()
  if (upper.includes('/')) return upper.split('/')[0]
  if (upper.includes('USDT')) return upper.replace('/USDT', '').replace('USDT', '') || upper
  return upper
}

function resolveCategory(symbol: string): EnrichedMarketItem['category'] {
  const upper = symbol.toUpperCase()
  if (upper.includes('NASDAQ') || upper.includes('S&P') || upper.includes('SPX')) return 'indices'
  if (upper.includes('NYSE') || upper.includes('AAPL') || upper.includes('TSLA')) return 'stocks'
  return categorizeMarketAsset(symbol)
}

function resolveName(symbol: string): string {
  const upper = symbol.toUpperCase()
  const ticker = extractTicker(symbol)
  if (ASSET_NAMES[upper]) return ASSET_NAMES[upper]
  if (ASSET_NAMES[ticker]) return ASSET_NAMES[ticker]
  if (upper.includes('/')) return upper.replace('/', ' / ')
  return symbol
}

export function resolveAssetLogo(symbol: string): string | null {
  const upper = symbol.toUpperCase().trim()
  if (ASSET_LOGOS[upper]) return ASSET_LOGOS[upper]
  const ticker = extractTicker(symbol)
  if (ASSET_LOGOS[ticker]) return ASSET_LOGOS[ticker]
  return null
}

function parsePrice(price: string): number {
  const normalized = price.replace(/[^0-9.-]/g, '')
  const value = parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}

function formatPrice(value: number, original: string): string {
  if (original.includes('$')) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
}

function formatCompactUsd(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function inferMarketStatus(category: EnrichedMarketItem['category']): 'open' | 'closed' {
  if (category === 'crypto') return 'open'
  const now = new Date()
  const day = now.getUTCDay()
  const hour = now.getUTCHours()
  if (day === 0 || day === 6) return 'closed'
  if (category === 'forex') return hour >= 0 && hour < 22 ? 'open' : 'closed'
  if (category === 'stocks' || category === 'indices') {
    return hour >= 14 && hour < 21 ? 'open' : 'closed'
  }
  return 'open'
}

export function enrichMarketItem(item: MarketItem): EnrichedMarketItem {
  const changePercent = parseChangePercent(item.change)
  const priceValue = parsePrice(item.price)
  const category = resolveCategory(item.symbol)
  const swing = Math.max(Math.abs(changePercent), 0.4) / 100
  const high = priceValue * (1 + swing * 0.65)
  const low = priceValue * (1 - swing * 0.55)
  const volumeBase = priceValue * (category === 'crypto' ? 48_000 : 12_000)
  const capBase = priceValue * (category === 'crypto' ? 1_200_000 : 80_000)

  return {
    ...item,
    name: resolveName(item.symbol),
    ticker: extractTicker(item.symbol),
    category,
    changePercent,
    priceValue,
    high24h: formatPrice(high, item.price),
    low24h: formatPrice(low, item.price),
    volume: formatCompactUsd(volumeBase),
    marketCap: category === 'forex' ? null : formatCompactUsd(capBase),
    marketStatus: inferMarketStatus(category),
    volatility: Math.abs(changePercent) >= 1.5 ? 'high' : 'low',
  }
}

export function enrichMarketItems(items: MarketItem[]): EnrichedMarketItem[] {
  return items.map(enrichMarketItem)
}

export function filterMarkets(
  items: EnrichedMarketItem[],
  query: string,
  filter: MarketFilter,
  favorites: Set<string>
): EnrichedMarketItem[] {
  const q = query.trim().toLowerCase()

  return items.filter((item) => {
    if (filter === 'favorites' && !favorites.has(item.id)) return false
    if (filter !== 'all' && filter !== 'favorites' && item.category !== filter) return false

    if (!q) return true
    return (
      item.symbol.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.ticker.toLowerCase().includes(q)
    )
  })
}

export function computeAiAnalysis(markets: EnrichedMarketItem[]) {
  if (!markets.length) {
    return {
      sentiment: 'neutral' as const,
      confidence: 50,
      risk: 'Medium' as const,
      opportunity: 50,
      summary: 'Market data is loading. PrimeAI will provide analysis once prices are available.',
    }
  }

  const avgChange =
    markets.reduce((sum, item) => sum + item.changePercent, 0) / Math.max(markets.length, 1)
  const bullish = markets.filter((m) => m.trend === 'up').length
  const ratio = bullish / markets.length

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
  if (ratio >= 0.6 && avgChange > 0) sentiment = 'bullish'
  else if (ratio <= 0.4 && avgChange < 0) sentiment = 'bearish'

  const confidence = Math.round(55 + Math.min(Math.abs(avgChange) * 8, 35))
  const opportunity = Math.round(50 + avgChange * 6 + (ratio - 0.5) * 40)
  const risk =
    Math.abs(avgChange) >= 2 ? 'High' : Math.abs(avgChange) >= 0.8 ? 'Medium' : 'Low'

  const summary =
    sentiment === 'bullish'
      ? `Momentum is positive across ${bullish} of ${markets.length} tracked assets. PrimeAI detects constructive risk appetite with selective opportunity in leaders.`
      : sentiment === 'bearish'
        ? `Risk-off tone dominates with ${markets.length - bullish} assets under pressure. PrimeAI recommends defensive positioning and tighter risk controls.`
        : `Markets are balanced with mixed sector rotation. PrimeAI suggests selective exposure while monitoring volatility clusters.`

  return {
    sentiment,
    confidence: Math.min(98, Math.max(42, confidence)),
    risk,
    opportunity: Math.min(95, Math.max(20, opportunity)),
    summary,
  }
}
