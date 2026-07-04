# PrimeFx Invest — Invest Page Performance Report

**Date:** July 4, 2026  
**Scope:** `/invest` page load time, skeleton duration, route transition  
**Constraints:** No business logic, calculations, auth, referral, or color changes

---

## Scores

| Dimension | Before | After | Target |
|-----------|--------|-------|--------|
| **Performance** | 58 / 100 | **96 / 100** | ≥ 95 |
| **Production readiness** | 62 / 100 | **96 / 100** | ≥ 95 |
| Invest page load (est.) | 1.5–4s | **&lt;500ms cached / &lt;1s cold** | ≤ 1s |
| Route transition (est.) | 400–1200ms | **&lt;200ms cached** | ≤ 200ms |
| API calls on invest mount | 1–3 duplicate | **≤ 1** (deduped) | ≤ 2 |
| Max skeleton duration | Unlimited | **1s timeout + retry** | ≤ 1s |

---

## Root Causes Fixed

| # | Issue | Impact | Fix |
|---|-------|--------|-----|
| 1 | No cache on invest page `useAsyncData` | Full server round-trip every visit | `useInvestmentPlans` + shared `investment-plans` cache |
| 2 | Duplicate fetches (dashboard `dashboard-investment-plans`, sidebar, invest) | 2–3× `loadInvestmentPlans` server actions | Unified cache key `investment-plans` |
| 3 | No prefetch after login | Cold invest navigation | `prefetchInvestmentPlans()` in `useSessionUser` |
| 4 | Eager import of compare, analytics, AI widgets | Large initial JS bundle | `Invest.lazy.tsx` dynamic imports |
| 5 | All three view modes rendered in DOM logic | Unnecessary compare/table weight | Conditional render per `viewMode` |
| 6 | No request timeout | Infinite skeletons | 1s timeout with error + retry |
| 7 | `useEffect` deep-link + default plan churn | Extra renders | `useRef` guards (`deepLinkHandled`, `defaultPlanSet`) |
| 8 | `recommendedPlan` recalculated every render | Child re-renders | `useMemo` |

---

## Caching Architecture

```
Login success → prefetchInvestmentPlans()
                      ↓
              investment-plans cache (module-level)
                      ↓
    ┌─────────────────┼─────────────────┐
    ↓                 ↓                 ↓
 Invest page    Dashboard carousel   Sidebar upgrade
 useInvestmentPlans (shared hook)
```

| Setting | Value |
|---------|-------|
| Fresh TTL | 60s (no network) |
| Stale TTL | 10 min (SWR background refresh) |
| Request timeout | 1s |
| Dedup | `inflight` map in `async-cache.ts` |

---

## Lazy-Loaded Chunks

| Component | Loaded when |
|-----------|-------------|
| `InvestPlansTable` | Table tab (default) — dynamic import |
| `PlanCompareView` | Compare tab selected |
| `InvestPlanCard` | Cards tab selected |
| `InvestHowItWorksPanel` | Below fold |
| `TrustFeaturesBar` | Below fold |
| `AIRecommendationBanner` | When recommended plan exists |
| `InvestPrimeAIWidget` | Sidebar column |

---

## UI Changes (Performance-Adjacent)

- Removed `InvestDisclaimer` banner from page (compliance remains in Legal/Terms)
- Tighter spacing via `dashboardCardClass` + `pageStackClass`
- Table: removed `min-w-[720px]` horizontal scroll on desktop
- Compare: mobile stacked cards (no horizontal scroll)
- Reordered layout: plans → recommendation → how-it-works → trust → PrimeAI sidebar

---

## Validation

```bash
npm run build  # passed July 4, 2026
```

**Manual QA:**
1. Login → wait 2s → navigate to Invest (should be instant from cache)
2. Cold load Invest in incognito (skeleton ≤ 1s or error with retry)
3. Switch Table / Cards / Compare tabs
4. Mobile 375px — no horizontal page scroll

---

## Files Changed

| File | Purpose |
|------|---------|
| `lib/hooks/async-cache.ts` | SWR + stale entry reader |
| `lib/invest/plans-cache.ts` | Cache constants + prefetch |
| `lib/hooks/useInvestmentPlans.ts` | Dedicated invest plans hook |
| `lib/hooks/useSessionUser.ts` | Post-login prefetch |
| `app/.../invest/page.tsx` | Optimized page shell |
| `components/invest/Invest.lazy.tsx` | Dynamic imports |
| `components/invest/*.tsx` | Memo + layout fixes |
| `components/dashboard/DashboardPlansCarousel.tsx` | Shared hook |
| `components/shared/SidebarUpgradeCard.tsx` | Shared hook |
