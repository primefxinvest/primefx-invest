import type { MarketItem } from '@/lib/data/types'

export type MarketCategory = 'crypto' | 'forex' | 'commodities' | 'stocks' | 'indices' | 'other'

export function categorizeMarketAsset(symbol: string): MarketCategory {
  const upper = symbol.toUpperCase()
  if (
    upper.includes('NASDAQ') ||
    upper.includes('S&P') ||
    upper.includes('SPX') ||
    upper.includes('DOW')
  ) {
    return 'indices'
  }
  if (
    upper.includes('BTC') ||
    upper.includes('ETH') ||
    upper.includes('USDT') ||
    upper.includes('SOL') ||
    upper.includes('BNB') ||
    upper.includes('XRP') ||
    upper.includes('ADA') ||
    upper.includes('DOGE') ||
    upper.includes('TON') ||
    upper.includes('AVAX') ||
    upper.includes('LINK')
  ) {
    return 'crypto'
  }
  if (upper.includes('/') && (upper.includes('USD') || upper.includes('EUR') || upper.includes('GBP') || upper.includes('JPY'))) {
    return 'forex'
  }
  if (
    upper.includes('GOLD') ||
    upper.includes('SILVER') ||
    upper.includes('OIL') ||
    upper.includes('XAU') ||
    upper.includes('WTI')
  ) {
    return 'commodities'
  }
  if (upper.includes('NYSE') || upper.includes('AAPL') || upper.includes('TSLA') || upper.includes('MSFT')) {
    return 'stocks'
  }
  return 'other'
}

export function parseChangePercent(change: string): number {
  const normalized = change.replace(/[+%()]/g, '').replace('−', '-')
  const value = parseFloat(normalized)
  return Number.isFinite(value) ? value : 0
}

export function sortByChange(markets: MarketItem[], direction: 'asc' | 'desc'): MarketItem[] {
  return [...markets].sort((a, b) => {
    const diff = parseChangePercent(a.change) - parseChangePercent(b.change)
    return direction === 'desc' ? -diff : diff
  })
}

export function filterByCategory(markets: MarketItem[], category: MarketCategory): MarketItem[] {
  return markets.filter((item) => categorizeMarketAsset(item.symbol) === category)
}

export function computeMarketSentiment(markets: MarketItem[]): {
  score: number
  label: string
  bullish: number
  bearish: number
  neutral: number
} {
  if (!markets.length) {
    return { score: 50, label: 'Neutral', bullish: 0, bearish: 0, neutral: 0 }
  }

  let bullish = 0
  let bearish = 0
  markets.forEach((item) => {
    if (item.trend === 'up') bullish += 1
    else bearish += 1
  })
  const neutral = 0
  const score = Math.round((bullish / markets.length) * 100)

  let label = 'Neutral'
  if (score >= 65) label = 'Bullish'
  else if (score <= 35) label = 'Bearish'

  return { score, label, bullish, bearish, neutral }
}
