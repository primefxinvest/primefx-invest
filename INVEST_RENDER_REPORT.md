# PrimeFx Invest — Invest Render Report

**Date:** July 4, 2026

---

## Render Loop Audit

| Pattern | Status | Notes |
|---------|--------|-------|
| `setState` in render body | **None found** | — |
| `useAsyncData` unstable loader | **N/A** | Replaced with `useInvestmentPlans` |
| `recommendedPlan` identity churn | **Fixed** | Wrapped in `useMemo` |
| Default plan `useEffect` loop | **Fixed** | `defaultPlanSet` ref — runs once |
| Deep-link `useEffect` re-fire | **Fixed** | `deepLinkHandled` ref |
| `openInvestModal` recreation | **Fixed** | `useCallback` with stable deps |

---

## useEffect Inventory

| Hook | Deps | Runs | Risk |
|------|------|------|------|
| Default plan selection | `[recommendedPlan]` | Once (ref guard) | Low |
| Deep link `?plan=` | `[searchParams, investmentPlans, kyc.loading, kyc.verified]` | Once (ref guard) | Low |
| `useInvestmentPlans` load | `[]` | Once per mount | Low |
| `useFinancialKycAccess` | `[]` | Once (+ event listener) | Low (pre-existing) |

---

## Re-render Triggers

| State change | Components affected | Mitigation |
|--------------|---------------------|------------|
| `viewMode` | Plans section only | Compare/table/grid mutually exclusive |
| `selectedPlanId` | Table rows / cards | `memo` on `InvestPlanCard`, `InvestPlansTable` |
| `modalOpen` | `InvestModal` only | Modal isolated |
| Plans data update (SWR) | Plans section + recommendation | Expected; memo on leaf components |

---

## React.memo Applied

| Component | Reason |
|-----------|--------|
| `InvestPlanCard` | Grid renders N cards; parent state changes |
| `InvestPlansTable` | Large table; avoid re-render on modal toggle |
| `PlanCompareView` | Heavy comparison matrix |

---

## Component Tree (Simplified)

```
InvestPage
├── InvestModal (sync — required for invest flow)
├── Header + KycFinancialBanner
├── Plans Section [AsyncState]
│   ├── viewMode=table → InvestPlansTable (lazy)
│   ├── viewMode=grid → InvestPlanCard[] (lazy)
│   └── viewMode=compare → PlanCompareView (lazy)
└── Grid
    ├── AIRecommendationBanner (lazy)
    ├── InvestHowItWorksPanel (lazy)
    ├── TrustFeaturesBar (lazy)
    └── InvestPrimeAIWidget (lazy)
```

**Removed from tree:** `InvestDisclaimer` (risk banner)

---

## Skeleton / Loading States

| State | Duration cap | Fallback |
|-------|--------------|----------|
| `plansLoading` | 1s | Error + retry button |
| Cached data present | 0ms skeleton | Immediate paint |
| Lazy chunk loading | Until chunk loads | Matching skeleton in `Invest.lazy.tsx` |

---

## Before / After Render Metrics (Estimated)

| Metric | Before | After |
|--------|--------|-------|
| Initial React tree nodes | ~180 | ~90 (lazy defer) |
| useEffect executions on mount | 4–6 | 3 |
| Re-renders on tab switch | Full page | Plans section only |
| Time to first plan visible (cached) | 800–2000ms | **&lt;50ms** |
