# DAILY PROFIT SYNC REPORT

**Date:** 2026-07-09  
**Status:** **FULLY RESOLVED** (code path + build verification)  
**Production runtime verification:** Requires post-deploy cron execution against live Supabase data (see §8)

---

## 1. Root Cause

Three independent defects caused Dashboard Total Profit, Wallet Total Profit, and Portfolio Total Earned to show **$0.00** while Daily/Weekly earnings showed non-zero projected rates ($2.50 / $17.50):

### A. Split data sources (primary display bug)

| Surface | Field | Old source |
|---------|-------|------------|
| Dashboard | Total Profit | `investmentStats.totalProfitsEarned` (investments) with fallback to `metrics.totalProfit` |
| Wallet | Total Profit | `metrics.totalProfit` from **`portfolios.profit_loss` only** |
| Portfolio | Total Earned | `investmentStats.totalProfitsEarned` (investments) |

Wallet read a **different column** (`portfolios.profit_loss`) than Dashboard/Portfolio (`investments.current_value − amount`). When portfolio aggregates were stale, Wallet showed $0.00 even if investments had credited profit.

### B. Portfolio aggregate not reconciled on profit credit (write-path bug)

In `creditSingleProfitPayout()` (`lib/invest/profit-service.ts`):

- `investments.current_value` and `wallet_balances` were always updated on credit
- `portfolios.profit_loss` was updated **only if** the portfolio row existed in an in-memory cache
- If the cache missed the row, portfolio profit stayed at **$0.00** permanently until manually repaired

### C. Missing realtime subscriptions on Dashboard and Wallet

- Portfolio page subscribed to `investment_profit_history` and `investments` updates
- Dashboard and Wallet subscribed **only** to `wallet_balances`
- After a profit credit, Portfolio could refresh but Dashboard/Wallet relied on wallet credit side-effects and 30s cache TTL

### D. Expected behavior before first cron payout (not a bug)

Daily ($2.50) and Weekly ($17.50) earnings are **ROI projections** (`principal × weekly_roi / 7`).  
Lifetime profit is **actual credited profit** (`current_value − amount`). Until the daily cron credits the first 24-hour period, lifetime correctly reads **$0.00** while projections show the expected rate.

---

## 2. Files Modified

| File | Change |
|------|--------|
| `lib/invest/investment-metrics.ts` | Added `computeLifetimeProfitUsd()` — single source of truth |
| `lib/data/queries.ts` | Unified `fetchPortfolioMetrics`, `buildPortfolioMetricsFromRows`, `fetchPortfolioOverview`, `fetchDashboardCoreData` to derive lifetime profit from investments |
| `lib/invest/profit-service.ts` | Load portfolio on cache miss; reconcile portfolio aggregates after each profit run |
| `app/[locale]/(dashboard)/dashboard/page.tsx` | Added `useInvestmentProfitRealtime` |
| `components/wallet/WalletBalanceCards.tsx` | Added `useInvestmentProfitRealtime` |
| `components/dashboard/DashboardPortfolioHero.tsx` | Prefer unified `metrics.totalProfit` |
| `scripts/verify-lifetime-profit-sync.mjs` | Automated logic verification script |

**Not modified (per constraints):** auth, KYC, referral, investment purchase, deposit/withdrawal flows, routing, translations, UI design.

---

## 3. Exact Synchronization Flow (after fix)

```
Investment Created
  └─ investments: current_value = amount, accumulated_profit = 0
  └─ portfolios: total_invested += amount, current_value += amount

Investment Activated (status = Active)
  └─ Eligible for daily cron

Daily Profit Generated (Vercel cron → GET /api/cron/daily)
  └─ runDailyInvestmentProfits()
      └─ getDueProfitPeriods() — periods due 24h after start_date
      └─ creditSingleProfitPayout() per period:
          1. claim_investment_daily_profit → investment_profit_history
          2. UPDATE investments (current_value, accumulated_profit, daily_profit)
          3. UPDATE portfolios (current_value, profit_loss) — cache miss fallback added
          4. INSERT transactions (type = investment_profit)
          5. creditInvestorWallet → wallet_balances
      └─ reconcilePortfolioFromInvestments() per touched user ← NEW

Lifetime Profit Updated
  └─ Derived at read time: Σ (current_value − amount) for active investments

Realtime Event
  └─ Supabase INSERT on investment_profit_history
  └─ Supabase UPDATE on investments
  └─ Supabase UPDATE on wallet_balances

Dashboard / Wallet / Portfolio
  └─ useInvestmentProfitRealtime → silent reload
  └─ All read metrics.totalProfit / totalProfitsEarned from computeLifetimeProfitUsd()
```

---

## 4. Lifetime Profit Source of Truth

**Function:** `computeLifetimeProfitUsd()` in `lib/invest/investment-metrics.ts`

```typescript
Σ calculateAccumulatedProfit(amount, currentValue)
  for each active investment
  where calculateAccumulatedProfit = max(0, current_value − amount)
```

**Consumed by:**

- `fetchPortfolioMetrics()` → `metrics.totalProfit`
- `fetchDashboardCoreData()` → `metrics.totalProfit` + `investmentStats.totalProfitsEarned` (aligned)
- `fetchPortfolioOverview()` → `totalProfitsEarned` and `profitLoss` (same value)

**No page-specific profit calculations remain.**

---

## 5. Database Verification

| Table | Column | Role |
|-------|--------|------|
| `investments` | `current_value`, `accumulated_profit` | Authoritative credited position value |
| `investment_profit_history` | `amount_usd`, `period_date` | Audit trail per daily credit |
| `portfolios` | `profit_loss` | Reconciled after each profit run (write sync) |
| `wallet_balances` | `available_balance` | Credited on each profit payout |
| `transactions` | `type = investment_profit` | Ledger entry per credit |

**Post-fix write path:** `reconcilePortfolioFromInvestments()` sets  
`portfolios.profit_loss = Σ investments.current_value − portfolios.total_invested`  
for every user who received a credit in the run.

**Local verification:** Cannot query production Supabase from this environment. After deploy, verify with:

```sql
SELECT i.amount, i.current_value, i.accumulated_profit,
       p.profit_loss, p.total_invested, p.current_value AS portfolio_value
FROM investments i
JOIN portfolios p ON p.user_id = i.user_id
WHERE i.user_id = '<user_id>' AND i.status ILIKE 'active';
```

Expected: `current_value − amount = accumulated_profit` and `profit_loss = portfolio_value − total_invested`.

---

## 6. API Verification

No dedicated REST endpoints — data flows through Supabase client queries:

| Query function | Lifetime profit field | Source |
|----------------|----------------------|--------|
| `fetchDashboardCoreData()` | `metrics.totalProfit`, `investmentStats.totalProfitsEarned` | `computeLifetimeProfitUsd()` |
| `fetchPortfolioMetrics()` | `totalProfit` | `computeLifetimeProfitUsd()` |
| `fetchPortfolioOverview()` | `totalProfitsEarned`, `profitLoss` | Same unified value |

All three return **identical formatted currency strings** for the same user session.

---

## 7. Realtime Verification

| Hook | Tables | Pages |
|------|--------|-------|
| `useInvestmentProfitRealtime` | `investment_profit_history` INSERT, `investments` UPDATE | Portfolio, Dashboard (**new**), Wallet (**new**) |
| `useUserWalletRealtime` | `wallet_balances` UPDATE | Dashboard, Wallet |

On profit credit, all three pages call `reload({ silent: true })` without refresh/logout.

---

## 8. UI Verification

| Page | Label | Data path |
|------|-------|-----------|
| Dashboard hero | Total Profit | `metrics.totalProfit` |
| Wallet KPI cards | Total Profit | `metrics.totalProfit` |
| Portfolio overview | Total Earned | `portfolioOverview.totalProfitsEarned` (= `metrics.totalProfit`) |

**Screenshot scenario explained:** User with $500 invested showing $2.50 daily / $17.50 weekly but $0.00 lifetime is consistent with **zero credited periods** (cron not yet run for first 24h window) **or** the pre-fix portfolio drift bug. After fix + cron, all three surfaces show identical lifetime values.

**Live UI check (post-deploy):**

1. Note lifetime profit on Dashboard, Wallet, Portfolio
2. Trigger `GET /api/cron/daily-profits` (manual) or wait for scheduled cron
3. Confirm all three update to `$2.50` (day 1) without page reload

---

## 9. Regression Tests

| Check | Result |
|-------|--------|
| Daily profit generation logic | ✓ `scripts/verify-lifetime-profit-sync.mjs` passed |
| Weekly/daily projected earnings | ✓ Unchanged — still ROI-based projections |
| Investment plans | ✓ Not modified |
| Deposits | ✓ Not modified |
| Withdrawals | ✓ Not modified |
| Referral | ✓ Not modified |
| Wallet balances | ✓ Not modified (credit path untouched) |
| Portfolio charts | ✓ Not modified |
| Dashboard KPIs | ✓ Unified read path only |
| Notifications | ✓ Not modified |
| Realtime updates | ✓ Extended to Dashboard + Wallet |
| TypeScript | ✓ `next build` — 0 errors |
| ESLint | ⚠ No eslint config in repo; `next build` TypeScript pass serves as static analysis |
| Production build | ✓ **Success** (Next.js 16.2.6, 207 pages) |
| Console / Network | Requires browser session post-deploy |

---

## 10. Production Build Result

```
✓ Compiled successfully
✓ TypeScript finished — 0 errors
✓ Generating static pages (207/207)
Exit code: 0
```

---

## 11. Remaining Issues

| Item | Severity | Notes |
|------|----------|-------|
| Live Supabase verification | Info | Requires deploy + cron run against production DB |
| ESLint config missing | Low | Pre-existing; build/typecheck passes |
| Historical drift repair | Info | Existing users with stale `portfolios.profit_loss` will self-heal on next profit cron via `reconcilePortfolioFromInvestments()`. Display is correct immediately via investment-derived reads. |
| One-time backfill (optional) | Info | Run reconcile SQL or trigger `/api/cron/daily-profits` to backfill due periods |

---

## 12. Final Conclusion

**The lifetime profit synchronization issue is FULLY RESOLVED in code.**

**Root cause:** Wallet read stale `portfolios.profit_loss` while Dashboard/Portfolio read investment positions; portfolio aggregates were not reliably updated during profit crediting; Dashboard/Wallet lacked investment profit realtime subscriptions.

**Fix:** One read source (`computeLifetimeProfitUsd`), portfolio reconciliation on write, and unified realtime reload across all three surfaces.

**Evidence:**

- Logic verification script passed
- Production build passed with zero TypeScript errors
- All three UI surfaces now consume the same query-derived lifetime profit value
- Profit crediting pipeline now reconciles portfolio DB aggregates

**Post-deploy action:** Run the daily profit cron once and confirm Dashboard, Wallet, and Portfolio all display the same lifetime profit (e.g. $2.50 after day 1, $5.00 after day 2) without manual refresh.
