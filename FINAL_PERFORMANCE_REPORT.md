# PrimeFx Invest — Final Performance Report

**Date:** July 4, 2026

---

## Dashboard Optimization (Primary)

### Before
- 4 parallel `useAsyncData` hooks on dashboard page
- Duplicate `getUserPortfolio` (metrics + chart)
- Duplicate `getUserInvestments` (chart + allocation)
- Separate `getUserTransactionsSince` + `getUserTransactions(limit:4)`
- ~12–15 Supabase table queries on cold load

### After
- **1 bundled fetch:** `fetchDashboardCoreData()`
  - `Promise.all`: portfolio, wallet, investments, cached transactions
  - Derives metrics, wallet, allocation server-side in one round-trip
- **Chart:** `buildPortfolioChartData()` in `useMemo` — **zero extra fetch** on period change
- **Recent transactions:** sliced from `getCachedUserTransactions` (no separate limit query)

### Target API Calls (Dashboard initial)

| Call | Purpose |
|------|---------|
| 1 | `fetchDashboardCoreData` (4 tables in one `Promise.all`) |
| 2 | `fetchMarketOverview` (lazy, dynamic import) |
| 3 | `fetchNotifications` (layout, deduped cache) |
| 4 | `loadInvestmentPlansCached` (SWR, often prefetched) |

Deferred: rewards/referral/learning secondary sections via `requestIdleCallback` + dynamic import.

---

## Cache Unification

**File:** `lib/data/cache-keys.ts`

| Key | Shared by |
|-----|-----------|
| `portfolio-metrics` | Wallet, dashboard bundle consumers |
| `wallet-data` | Dashboard, wallet |
| `dashboard-core` | Dashboard page |
| `rewards-data` | Dashboard secondary, rewards page |

---

## React Optimizations

- `React.memo(InvestorKpiCards)`
- `useCallback` wallet realtime handler on dashboard
- Dynamic import: `DashboardSecondarySectionsDeferred`
- `useInvestorTier` — no duplicate `users` query

---

## Existing Infrastructure (Retained)

- `loadWithAsyncCache` / inflight dedup (`lib/hooks/async-cache.ts`)
- Transaction cache (`lib/data/user-transactions-cache.ts`, 30s TTL)
- Investment plans SWR (`lib/invest/plans-cache.ts`)
- Session user singleton (`useSessionUser`)

---

## Recommended Next Steps

1. Extend `fetchDashboardCoreData` cache to wallet page (single hook reuse)
2. Hoist notifications to layout provider
3. Wire `NotificationPushListener` through async cache
4. Portfolio page: reuse `dashboard-core` cache for overlapping metrics

---

## Build

Run `npm run build` after deployment to confirm bundle integrity.
