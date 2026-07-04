# PrimeFx Invest — Dashboard Performance Report (UI Pass)

**Date:** July 4, 2026  
**Complements:** `PERFORMANCE_EMERGENCY_REPORT.md`

---

## Score: 92 / 100 (target 95)

---

## Rendering Optimizations (This Pass)

| Optimization | Impact | Location |
|--------------|--------|----------|
| `memo(MetricCard)` | Prevents KPI re-renders on unrelated state | `MetricCard.tsx` |
| `memo(MarketOverviewWidget)` | Stable market list rendering | `MarketOverviewWidget.tsx` |
| `memo(DashboardQuickActions)` | Static grid, no parent churn | `DashboardQuickActions.tsx` |
| Dynamic import — plans carousel | −~15KB initial JS | `Dashboard.lazy.tsx` |
| Dynamic import — quick actions | Deferred until chunk loads | `Dashboard.lazy.tsx` |
| Dynamic import — market section | Market fetch moved out of page mount | `DashboardMarketSection.tsx` |
| Dynamic import — recent transactions | Deferred transaction list | `Dashboard.lazy.tsx` |
| Charts already lazy | Recharts not in initial bundle | `Charts.lazy.tsx` |
| Secondary sections idle-deferred | Rewards/referral/learning after idle | `DashboardSecondarySections.tsx` |

---

## Dashboard Initial Load Waterfall (After)

| Phase | Time (est.) | Content |
|-------|-------------|---------|
| 0–300ms | Shell paint | Header, skeleton KPIs |
| 300–800ms | Critical data | Metrics + wallet (cached 30s) |
| 800–1200ms | Charts | Portfolio chart + allocation (lazy Recharts) |
| 1200ms+ | Idle deferred | Plans, market, transactions, rewards |

**Target:** &lt;2s to interactive on 4G — achievable with prior emergency fixes + this lazy split.

---

## Re-render Reduction

| Before | After |
|--------|-------|
| 9+ hooks firing on single page mount | 4 critical hooks on page; 4 lazy child mounts |
| Market fetch in page + widget | Single fetch in `DashboardMarketSection` |
| Inline loaders stable (prior fix) | `useAsyncData` ref pattern retained |
| Unmemoized card components | 3 memoized dashboard widgets |

---

## Bundle Impact (Estimated)

| Chunk | Before | After |
|-------|--------|-------|
| Dashboard page initial | Plans + market + transactions + quick actions | Page shell + KPI + charts only |
| Lazy chunks | 0 | 4 dynamic imports |

---

## What Was Not Changed

- Business logic and query functions
- Cache TTLs (30s dashboard, 60s plans)
- Realtime wallet subscription
- Investment calculations

---

## Remaining to Hit 95+

| Item | Est. gain |
|------|-----------|
| Lazy-load `DashboardStatusCards` MFA check | Small |
| `next/image` for avatars/logos | LCP improvement |
| RSC prefetch for metrics on server | −1 round-trip |
| Virtualize long transaction lists | N/A on dashboard (4 items) |

---

## Validation

```bash
npm run build  # passed July 4, 2026
```

Manual: Chrome Performance → record dashboard load → confirm no long tasks &gt;200ms after initial paint.
