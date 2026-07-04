# PrimeFx Invest — KPI Component Reuse Report

**Date:** July 4, 2026

---

## Shared KPI Module

**Location:** `components/shared/kpi/`

```
components/shared/kpi/
├── KpiCard.tsx    # Metric card primitive
├── KpiGrid.tsx    # Responsive grid (count 4 | 5)
└── index.ts       # Public exports
```

**Import path:** `@/components/shared/kpi`

```ts
import { KpiCard, KpiGrid, trendColorFromPercentage } from '@/components/shared/kpi'
```

---

## Consumer Matrix

| Surface | File | Grid | Cards | Notes |
|---------|------|------|-------|-------|
| **Dashboard** | `app/[locale]/(dashboard)/dashboard/page.tsx` | `KpiGrid count={5}` | 5 × `KpiCard` | Balance & Current Value link out |
| **Wallet Overview** | `components/wallet/WalletBalanceCards.tsx` | `KpiGrid count={4}` | 4 × `KpiCard` | Caption subtexts (no trends) |
| **Portfolio Overview** | `app/[locale]/(dashboard)/portfolio/page.tsx` | `KpiGrid count={4}` | 4 × `KpiCard` | Conditional value color on P/L & ROI |
| **Referral Analytics** | `components/referral/ReferralStatsGrid.tsx` | Custom grid | 7 × `KpiCard` | Health gauge stays separate |

---

## Reuse Patterns

### Pattern A — Trend metrics (Dashboard)

```tsx
<KpiCard
  label={t('currentValue')}
  value={metrics?.currentValue ?? '$0.00'}
  trend={metrics?.trends[1]?.percentage}
  trendSuffix={t('fromLastMonth')}
  trendColor={trendColorFromPercentage(metrics?.trends[1]?.percentage)}
  icon={<TrendingUp />}
  iconBg="bg-emerald-50 text-emerald-600"
/>
```

### Pattern B — Caption subtext (Wallet)

```tsx
<KpiCard
  label={t('available')}
  value={wallet?.availableBalance ?? '$0.00'}
  caption={t('availableSub')}
  captionClassName="text-emerald-500"
  icon={<Wallet />}
  iconBg="bg-emerald-50 text-emerald-500"
/>
```

### Pattern C — Linked card (Dashboard)

```tsx
<KpiCard href="/wallet" label={...} value={...} icon={...} />
```

### Pattern D — Custom styling (Referral primary, Portfolio P/L)

```tsx
<KpiCard className="ring-1 ring-[#0052ff]/10" ... />
<KpiCard valueClassName="text-red-600" ... />
```

---

## Deprecated Wrappers

| Legacy | Replacement | Status |
|--------|-------------|--------|
| `MetricCard` | `KpiCard` | Re-export with `@deprecated` JSDoc |
| `SummaryCard` | `KpiCard` | Portfolio migrated; file retained unused |
| `StatusCardGrid` | `KpiGrid` | No longer used for KPI rows on migrated pages |

Existing imports of `MetricCard` elsewhere continue to work via the re-export.

---

## Shared Utilities

| Export | Purpose |
|--------|---------|
| `trendColorFromPercentage(value?)` | Maps `+`/`-` trend strings to `green` / `red` without new colors |
| `KpiGridCount` | Type union `4 \| 5` for grid and skeleton alignment |
| `MetricCardsSkeleton` | Loading placeholder using same grid topology |

---

## What Was Not Changed

- `HealthScoreGauge` in referral (specialized circular visualization)
- `statusCardSurfaceClass` token (design language preserved)
- Data loaders: `fetchPortfolioMetrics`, `fetchWalletData`, `fetchPortfolioOverview`, referral analytics
- Routes, auth, referral math, investment calculations

---

## Extension Guide

To add a new KPI row:

1. Choose `count={4}` or `count={5}` based on card count.
2. Map each metric to `<KpiCard>` with either `trend` + `trendSuffix` or `caption`.
3. Wrap in `<AsyncState skeleton={<MetricCardsSkeleton count={N} />}>`.
4. For non-standard layouts (e.g. 7 + gauge), use `KpiCard` inside a custom grid — do not force `KpiGrid`.

---

## Build Status

`npm run build` — **passed**. All consumers compile without type or import errors.
