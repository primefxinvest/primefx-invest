# Performance Report

**Date:** July 5, 2026  
**Targets:** TTI < 1s · Route transition < 200ms · ≤4 API calls/page · Lighthouse ≥ 95

---

## Changes Applied

### 1. Lazy-loaded wallet donut chart

**File:** `components/wallet/WalletCharts.lazy.tsx`

```tsx
export const WalletBalanceDonut = dynamic(
  () => import('@/components/wallet/WalletBalanceDonut'),
  { ssr: false, loading: () => <DonutChartSkeleton /> }
)
```

**Impact:** Removes `recharts` from wallet page initial JS bundle. Charts already lazy on Dashboard and Portfolio.

### 2. Cache key unification

**File:** `lib/data/cache-keys.ts`

| Key | Consumers (now deduped) |
|-----|-------------------------|
| `CACHE_KEYS.rewardsData` | Dashboard secondary sections + Rewards page |
| `CACHE_KEYS.marketOverview` | Dashboard market section + Market Insights |
| `CACHE_KEYS.userNotifications` | Navbar + Sidebar + Notifications page |
| `CACHE_KEYS.walletData` | WalletBalanceCards + WalletBalanceDonut |

**Impact:** Navigation between dashboard ↔ rewards ↔ market insights reuses cached data (30s TTL). Fewer Supabase round-trips.

### 3. Auth redirect guard optimization

**File:** `components/auth/AuthRedirectGuard.tsx`

Changed effect dependency from unstable `searchParams` object to `redirectParam = searchParams.get('redirect')`.

**Impact:** Prevents unnecessary session re-verification on unrelated query param changes.

### 4. Hydration-safe dashboard date

**File:** `dashboard/page.tsx`

Date badge renders client-side via `useEffect` + `suppressHydrationWarning`.

**Impact:** Eliminates hydration mismatch re-render on dashboard load.

---

## Existing Optimizations (Preserved)

- Dashboard charts: `Charts.lazy.tsx` with `ssr: false`
- Portfolio charts: `portfolio/Charts.lazy.tsx`
- Dashboard secondary sections: idle deferred load
- Deposit flow: auto-redirect, duplicate-submit guard
- `useAsyncData` with 30s TTL cache layer
- Transaction cache: `getCachedUserTransactions()` with inflight dedup

---

## Recommended Follow-Ups

| Priority | Item | Expected Gain |
|----------|------|---------------|
| High | `usePortfolioCore()` — bundle 5 portfolio hooks into 1 fetch | −3 API calls on /portfolio |
| Medium | PrimeAI dynamic import | −~40KB initial JS on /primeai |
| Medium | Referral chart extraction to lazy module | −recharts on /referral initial load |
| Medium | `NotificationPushListener` through async cache | Less background polling overlap |
| Low | Centralized `TransactionsRealtimeProvider` | One Supabase channel vs per-page |

---

## API Call Estimates (Post-Pass)

| Page | Calls (typical) | Notes |
|------|-----------------|-------|
| Dashboard | 3–4 | Bundled `dashboard-core` + deferred sections |
| Wallet | 2–3 | Shared `wallet-data` cache |
| Invest | 1–2 | Plans + KYC gate |
| Portfolio | 5 | **Needs bundling** (follow-up) |
| Market Insights | 2 | Market overview cached from dashboard visit |
| Rewards | 2–3 | Achievements + tiers (could bundle) |

---

## Lighthouse Projection

| Metric | Estimate |
|--------|----------|
| Performance | 94–96 |
| Accessibility | 92–95 |
| Best Practices | 95–100 |
| SEO | 95–100 |

Wallet donut lazy-load and cache dedup are the primary wins in this pass.
