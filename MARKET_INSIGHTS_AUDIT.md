# Market Insights Audit — PrimeFx Invest

**Date:** July 4, 2026  
**Scope:** Market Insights page transformation into trading intelligence dashboard  
**Status:** Implemented

---

## Executive Summary

Market Insights previously contained only a live market summary widget and a list of analysis articles. It has been expanded into a ten-section professional trading intelligence dashboard with multi-column desktop layout and mobile swipeable mover cards—without backend changes, route changes, or new API endpoints.

---

## Section Inventory

| # | Section | Implementation |
|---|---------|----------------|
| 1 | Market Overview | Existing `MarketOverviewWidget` |
| 2 | Trending Assets | Top movers by change % (`sortByChange`) |
| 3 | Top Gainers | Filter `trend === 'up'` |
| 4 | Top Losers | Filter `trend === 'down'`, sorted by magnitude |
| 5 | Forex Market | Category filter (EUR/USD, GBP/USD patterns) |
| 6 | Crypto Market | Category filter (BTC, ETH, USDT patterns) |
| 7 | Commodities | Category filter (GOLD, OIL, SILVER patterns) |
| 8 | AI Market Insights | Featured articles panel + PrimeAI CTA |
| 9 | Watchlist | First 4 market assets (derived from overview data) |
| 10 | Market Sentiment Index | Computed bullish/bearish ratio gauge |

---

## Data Strategy (Frontend-Only)

All sections derive from existing data:

- `fetchMarketOverview()` → `market_assets` table
- `fetchMarketInsightArticles(locale)` → market insights content

Category classification lives in `lib/market/categories.ts`:

```typescript
categorizeMarketAsset(symbol) → 'crypto' | 'forex' | 'commodities' | 'other'
computeMarketSentiment(markets) → { score, label, bullish, bearish }
```

No schema migrations or query modifications required.

---

## Layout Architecture

### Desktop (lg+)

```
[Header + PrimeAI CTA]
[Market Overview — full width]
[Trending | Top Gainers | Top Losers — 3 col]
[Forex | Crypto | Commodities — 3 col]
[AI Insights | Watchlist | Sentiment — 3 col]
[Latest Analysis — 2 col article grid]
```

### Mobile

- Stacked cards for overview and asset-class panels
- Horizontal snap carousel for Trending / Gainers / Losers (`snap-x`, contained scroll—no page-level horizontal overflow)
- Full-width sentiment, watchlist, and AI panels

---

## New Components

| File | Role |
|------|------|
| `components/market-insights/MarketAssetList.tsx` | Reusable asset list with mini sparklines |
| `components/market-insights/MarketSentimentIndex.tsx` | Gauge + bullish/bearish counts |
| `components/market-insights/MarketInsightPanels.tsx` | Watchlist + AI insights compact panels |
| `lib/market/categories.ts` | Asset categorization and sentiment utilities |

---

## Reference Benchmark

| Platform | Pattern Applied |
|----------|-----------------|
| TradingView | Multi-panel market dashboard |
| Binance Markets | Gainers/losers/trending columns |
| Bloomberg Terminal | Dense information hierarchy |
| Coinbase Markets | Clean asset rows with change indicators |

---

## Access Control (Unchanged)

- Route: `/market-insights`
- Tier gate: Growth (`InvestorPageGate feature="market_insights"`)
- Navigation tier lock preserved

---

## Constraints Verified

- [x] No horizontal page scroll
- [x] Equal spacing via `gridGapClass`
- [x] No backend changes
- [x] No route changes
- [x] PrimeFx `#0052ff` primary preserved
- [x] i18n keys reused (`marketInsightsPage` namespace)

---

## Future Enhancements (Out of Scope)

1. Add `category` column to `market_assets` for precise segmentation
2. User-configurable watchlist (requires persistence layer)
3. Real-time WebSocket price updates
