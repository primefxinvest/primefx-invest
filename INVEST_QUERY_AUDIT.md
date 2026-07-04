# PrimeFx Invest — Invest Query Audit

**Date:** July 4, 2026

---

## API / Data Calls on Invest Page

| # | Call | Type | Before | After |
|---|------|------|--------|-------|
| 1 | `loadInvestmentPlans()` | Server action → Supabase `investment_plans` | Every mount, no cache | Cached + SWR + deduped |
| 2 | `getFinancialKycAccess()` | Server action (KYC banner) | On mount | Unchanged (required for gating) |
| 3 | `processInvestment()` | Server action | On modal submit only | Unchanged |

**Target: ≤ 2 calls on page load** — Achieved: **1 plans query** (+ KYC check which is separate compliance path, not plans data).

---

## Supabase Query: `loadInvestmentPlans`

**Chain:** `loadInvestmentPlans` → `fetchPublicInvestmentPlans` → `createServerSupabaseClient`

```sql
SELECT * FROM investment_plans
WHERE is_active = true AND visibility = 'public'
ORDER BY minimum_investment ASC
```

**Fallback** (on error): full table ordered by `minimum_investment`.

| Property | Value |
|----------|-------|
| Pagination | None (4 plans — bounded) |
| Indexes needed | `is_active`, `visibility` (existing) |
| Rows returned | ~4 |

---

## Duplicate Query Detection (Before)

| Consumer | Cache key | Network on invest nav |
|----------|-----------|----------------------|
| `invest/page.tsx` | None | ✓ Always |
| `DashboardPlansCarousel` | `dashboard-investment-plans` | ✗ Separate cache |
| `SidebarUpgradeCard` | None | ✓ If sidebar mounted |

**Result:** Up to **3 independent** server action calls for identical data.

---

## Duplicate Query Detection (After)

| Consumer | Cache key | Network on invest nav |
|----------|-----------|----------------------|
| `invest/page.tsx` | `investment-plans` | ✗ if prefetched/cached |
| `DashboardPlansCarousel` | `investment-plans` | Shared |
| `SidebarUpgradeCard` | `investment-plans` | Shared |

**Dedup mechanism:**
1. `getStaleAsyncCacheEntry` — sync read on hook init
2. `inflight` Map — concurrent requests share one Promise
3. `loadWithStaleWhileRevalidate` — background refresh only when stale

---

## Prefetch Trigger

| Event | Action |
|-------|--------|
| `loadSessionUser()` success | `prefetchInvestmentPlans()` |
| Auth `SIGNED_IN` / `TOKEN_REFRESHED` | Session reload → prefetch |

---

## Query Count by Navigation Path

| Path | API calls (after) |
|------|-------------------|
| Dashboard → Invest (same session, &lt;60s) | **0** (cache hit) |
| Dashboard → Invest (stale, &lt;10min) | **0** display + **1** background SWR |
| Login → Invest (first visit) | **1** (prefetch may complete first) |
| Invest → reload retry | **1** (cache invalidated) |

---

## Recommendations (Future, No Logic Change)

| Item | Benefit |
|------|---------|
| Edge cache for `investment_plans` (CDN) | Sub-100ms global |
| Single RSC loader for plans | Zero client waterfall |
| `unstable_cache` on server for public plans | Reduce Supabase reads |
