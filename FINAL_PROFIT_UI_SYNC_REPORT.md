# FINAL PROFIT UI SYNC REPORT

**Date:** 2026-07-10  
**Status:** **FULLY RESOLVED**  
**Scope:** UI synchronization only — profit engine untouched

---

## 1. Root Cause

Three defects caused Dashboard, Wallet, and Portfolio to display **$0.00** (or incorrect values) while `investment_profit_history` already contained credited profits.

### A. Wrong aggregation source (primary)

Lifetime profit was computed as:

```
Σ (investments.current_value − investments.amount)   // active positions only
```

**Required source of truth:**

```sql
SELECT SUM(amount_usd)
FROM investment_profit_history
WHERE user_id = current_user;
```

**Live proof of divergence** (verification run):

| Source | Value |
|--------|-------|
| `SUM(investment_profit_history.amount_usd)` | **$24.14** |
| `current_value − amount` (old derivation) | **$7.30** |

The UI could never match credited profit history while reading `current_value`.

### B. Fragmented read paths

| Surface | Field | Old path |
|---------|-------|----------|
| Dashboard | Total Profit | `metrics.totalProfit` via `current_value` derivation |
| Wallet | Total Profit | `metrics.totalProfit` via `current_value` derivation |
| Portfolio | Total Earned | `totalProfitsEarned` via `computeInvestmentSummaryStats` → `current_value` |

All three called different code paths that converged on the **wrong formula**.

### C. Stale async cache without cross-page invalidation

| Cache key | Page |
|-----------|------|
| `dashboard-core` | Dashboard |
| `portfolio-metrics` | Wallet |
| `portfolio-overview` | Portfolio |

On profit credit, only the **mounted page** reloaded. Other cache keys retained stale `$0.00` for up to **30 seconds** (or until navigation after TTL).

`primefx:investment-updated` was dispatched but **never invalidated shared caches**.

---

## 2. Files Modified

| File | Change |
|------|--------|
| `lib/data/lifetime-profit.ts` | **NEW** — `fetchLifetimeProfitUsd()`, `sumLifetimeProfitUsd()`, `formatLifetimeProfitUsd()` |
| `lib/data/invalidate-lifetime-profit-caches.ts` | **NEW** — `invalidateLifetimeProfitCaches()` |
| `lib/data/cache-keys.ts` | Added `portfolioOverview` to shared keys |
| `lib/data/queries.ts` | All KPI fetches use `fetchLifetimeProfitUsd()` |
| `lib/invest/investment-metrics.ts` | `computeInvestmentSummaryStats` accepts `lifetimeProfitUsd` override |
| `lib/hooks/useInvestmentProfitRealtime.ts` | Invalidates all lifetime-profit caches on INSERT/UPDATE |
| `lib/hooks/useDashboardCore.ts` | `reload({ silent: true })` support |
| `app/[locale]/(dashboard)/dashboard/page.tsx` | Silent reload on profit realtime |
| `app/[locale]/(dashboard)/portfolio/page.tsx` | Shared cache key + silent reload |
| `scripts/verify-profit-ui-sync.mjs` | **NEW** — automated SQL vs UI verification |

**Not modified:** profit engine, auth, KYC, referrals, deposits, withdrawals, routing, translations, UI design, database schema.

---

## 3. Aggregation Path (fixed)

```
investment_profit_history (INSERT on daily credit)
        ↓
fetchLifetimeProfitUsd(userId)          ← lib/data/lifetime-profit.ts
  SELECT amount_usd WHERE user_id = ?
  SUM(amount_usd)
        ↓
formatLifetimeProfitUsd() → "+$24.14"
        ↓
┌───────────────────────────────────────────────────────┐
│ fetchPortfolioMetrics()        → metrics.totalProfit  │  Wallet
│ fetchDashboardCoreData()       → metrics.totalProfit  │  Dashboard
│ fetchPortfolioOverview()       → totalProfitsEarned   │  Portfolio
└───────────────────────────────────────────────────────┘
        ↓
useAsyncData cache (per-page key)
        ↓
DashboardPortfolioHero / InvestorKpiCards / Portfolio KpiCard
```

**Single function. Single number. Three surfaces.**

---

## 4. Cache Fixes

### Before

- Profit realtime → reload **only current page** cache
- Wallet cache stale on Dashboard; Portfolio cache stale on Wallet

### After

`invalidateLifetimeProfitCaches()` clears:

- `CACHE_KEYS.dashboardCore`
- `CACHE_KEYS.portfolioMetrics`
- `CACHE_KEYS.portfolioOverview`

Called **before** every `onChange` in `useInvestmentProfitRealtime`.

### Silent reload

Dashboard, Wallet, Portfolio reload with `{ silent: true }` — no skeleton flash, no page reload.

---

## 5. Realtime Fixes

| Event | Table | Action |
|-------|-------|--------|
| INSERT | `investment_profit_history` | `invalidateLifetimeProfitCaches()` → page `reload({ silent: true })` |
| UPDATE | `investments` | same |

**Hook wiring:**

| Page | Hooks |
|------|-------|
| Dashboard | `useInvestmentProfitRealtime` + `useUserWalletRealtime` |
| Wallet | `useInvestmentProfitRealtime` + `useUserWalletRealtime` |
| Portfolio | `useInvestmentProfitRealtime` |

**Result:** Next profit INSERT updates all three surfaces instantly when mounted; unmounted pages fetch fresh data on navigation (cache invalidated).

---

## 6. Verification SQL

```sql
-- Source of truth
SELECT SUM(amount_usd) AS lifetime_profit
FROM investment_profit_history
WHERE user_id = '<authenticated_user_id>';

-- Must equal all three UI values
```

### Live verification (2026-07-10)

```bash
node scripts/verify-profit-ui-sync.mjs
```

**Output:**

```
SELECT SUM(amount_usd) FROM investment_profit_history WHERE user_id = 'f6a1939b-...';
Result: $24.14

Dashboard Total Profit:  +$24.14
Wallet Total Profit:     +$24.14
Portfolio Total Earned:  +$24.14

allThreeMatch: true
weeklyEarningsProjected: $4.50  (unchanged — ROI projection)
oldCurrentValueDerivation: $7.30  (wrong — would have shown incorrect value)

VERIFICATION_PASSED
```

---

## 7. Before / After Values

| Metric | Before fix | After fix |
|--------|------------|-----------|
| Aggregation source | `current_value − amount` | `SUM(profit_history.amount_usd)` |
| Dashboard Total Profit | $0.00 / wrong | **+$24.14** |
| Wallet Total Profit | $0.00 / wrong | **+$24.14** |
| Portfolio Total Earned | $0.00 / wrong | **+$24.14** |
| Weekly earnings (projected) | $4.50 | $4.50 (unchanged) |
| Cross-page cache sync | ❌ Stale | ✅ Invalidated on credit |
| Realtime silent update | ❌ Partial | ✅ All three pages |

---

## 8. Zero Regression Confirmation

| Check | Result |
|-------|--------|
| Profit engine (`profit-service.ts`) | ✅ Not modified |
| Daily profit generation | ✅ Untouched |
| Weekly earnings projection | ✅ Still ROI-based (`calculateWeeklyEarnings`) |
| Investment purchase flow | ✅ Not modified |
| Deposits / withdrawals | ✅ Not modified |
| Referrals | ✅ Not modified |
| Per-investment table `accumulatedProfit` | ✅ Still uses `current_value − amount` (position-level, not lifetime KPI) |
| TypeScript | ✅ `next build` passed |
| Production build | ✅ Exit code 0 |
| Verification script | ✅ `VERIFICATION_PASSED` |

---

## 9. Flow Trace — Broken Steps Repaired

| Step | Was broken? | Fix |
|------|-------------|-----|
| `investment_profit_history` write | ✅ Working | No change |
| Lifetime aggregation | ❌ Used `current_value` | `fetchLifetimeProfitUsd()` |
| Server/service (`queries.ts`) | ❌ Three divergent paths | Single `fetchLifetimeProfitUsd()` call |
| API (client query functions) | ❌ Wrong field source | Unified in `fetchPortfolioMetrics`, `fetchDashboardCoreData`, `fetchPortfolioOverview` |
| React hooks (`useAsyncData`) | ❌ Stale cross-page cache | `invalidateLifetimeProfitCaches()` |
| Dashboard component | ❌ Stale / wrong value | Reads `metrics.totalProfit` from history sum |
| Wallet component | ❌ Stale / wrong value | Reads `metrics.totalProfit` from history sum |
| Portfolio component | ❌ Stale / wrong value | Reads `totalProfitsEarned` from history sum |
| Realtime | ❌ Partial cache invalidation | Global invalidation + silent reload |
| Hydration / serialization | ✅ OK | No server/client mismatch (client-only fetches) |
| Formatting | ✅ OK | `formatLifetimeProfitUsd()` consistent signed currency |

---

## 10. Final Conclusion

**Dashboard, Wallet, and Portfolio now display the identical lifetime profit sourced exclusively from `SUM(investment_profit_history.amount_usd)`.**

Verified live: **+$24.14** on all three surfaces vs SQL sum **$24.14**.

**Status: FULLY RESOLVED — PRODUCTION READY**
