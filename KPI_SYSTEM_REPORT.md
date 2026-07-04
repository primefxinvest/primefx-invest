# PrimeFx Invest — KPI System Report

**Date:** July 4, 2026  
**Scope:** KPI information architecture only (layout, component reuse, responsiveness)  
**Constraints honored:** No color, route, business logic, calculation, referral, or auth changes. No features removed.

---

## Executive Summary

PrimeFx Invest now uses a unified KPI system built on two shared primitives:

| Component | Role |
|-----------|------|
| `KpiCard` | Single metric surface — label, value, optional trend/caption, icon |
| `KpiGrid` | Responsive grid enforcing equal card dimensions and breakpoint layouts |

This delivers a consistent, institutional-grade KPI experience comparable to Binance, Revolut, Coinbase, and Robinhood: dense information, equal visual weight, and predictable scanning patterns.

---

## Dashboard KPI Layout

**File:** `app/[locale]/(dashboard)/dashboard/page.tsx`

### Card order (left → right)

1. **Current Balance** — `wallet.availableBalance`, links to `/wallet`
2. **Current Value** — `metrics.currentValue`, trend `metrics.trends[1]`
3. **Total Invested** — `metrics.totalInvested`, trend `metrics.trends[0]`
4. **Total Profit** — `metrics.totalProfit`, trend `metrics.trends[2]`
5. **ROI Overall** — `metrics.roiPercentage`, trend `metrics.trends[3]` with suffix *"ROI from last month"*

### Layout behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop / Laptop (`lg+`) | 5 cards in **one horizontal row** |
| Tablet (`md`–`lg`) | 3 cards row 1, 2 cards row 2 |
| Mobile (`<md`) | 2×2 grid; ROI spans full width (row 3) |

Trend coloring uses `trendColorFromPercentage()` — green for positive/neutral, red for negative — without altering the existing palette tokens.

---

## Wallet Overview KPI Layout

**File:** `components/wallet/WalletBalanceCards.tsx`

### Cards

1. Available Balance — caption: *Available to use*
2. Pending Balance — caption: *In processing*
3. Bonus Balance — caption: *Bonus earnings*
4. Total Balance — caption: *Total funds*

### Layout behavior

| Breakpoint | Layout |
|------------|--------|
| Desktop (`lg+`) | 4 cards in one row |
| Tablet / Mobile | 2×2 grid |

Data source and calculations unchanged (`fetchWalletData`).

---

## Portfolio Overview KPI Layout

**File:** `app/[locale]/(dashboard)/portfolio/page.tsx`

Four cards in `KpiGrid count={4}`:

- Current Value
- Profit / Loss (value color preserved for negative P/L)
- Total Invested
- ROI %

Replaces the previous split `StatusCardGrid` + `SummaryCard` layout.

---

## Referral Analytics KPI Layout

**File:** `components/referral/ReferralStatsGrid.tsx`

Seven stat cards now render via `KpiCard` (trend lines, captions, icons, primary ring highlight preserved). The **Network health** gauge remains a dedicated widget beside the stat row — referral calculations and funnel logic are untouched.

---

## Component API

### `KpiCard` (`components/shared/kpi/KpiCard.tsx`)

```
label, value, icon?, iconBg?, caption?, captionClassName?,
trend?, trendSuffix?, trendColor?, valueClassName?, href?, className?
```

- Uses `statusCardSurfaceClass` for PrimeFx card chrome
- Fixed min-height (`5.5rem` mobile / `6rem` desktop) for row alignment
- Optional `href` wraps card in i18n `Link` (dashboard Balance → Wallet, Current Value → Portfolio)

### `KpiGrid` (`components/shared/kpi/KpiGrid.tsx`)

```
count: 4 | 5
```

CSS grid with `items-stretch`, `gap-3 sm:gap-4`, and count-specific column templates.

### Backward compatibility

`MetricCard` re-exports `KpiCard` with a deprecation notice. `MetricCardsSkeleton` mirrors `KpiGrid` layouts for loading states.

---

## i18n

Added `dashboard.roiFromLastMonth` in `en`, `es`, `de`, `fr` for the ROI trend suffix (distinct from generic `fromLastMonth`).

---

## Files Changed

| File | Change |
|------|--------|
| `components/shared/kpi/KpiCard.tsx` | New unified KPI card |
| `components/shared/kpi/KpiGrid.tsx` | New responsive grid |
| `components/shared/kpi/index.ts` | Barrel exports |
| `components/shared/MetricCard.tsx` | Thin re-export |
| `components/shared/skeletons.tsx` | Skeleton aligned to `KpiGrid` |
| `app/[locale]/(dashboard)/dashboard/page.tsx` | 5-card KPI row |
| `components/wallet/WalletBalanceCards.tsx` | 4-card KPI row |
| `app/[locale]/(dashboard)/portfolio/page.tsx` | 4-card KPI row |
| `components/referral/ReferralStatsGrid.tsx` | `KpiCard` for stats |
| `messages/*.json` | `roiFromLastMonth` key |

---

## Build Verification

`npm run build` — **passed** (Next.js 16.2.6, exit 0).

---

## Design Benchmark Alignment

| Principle | Implementation |
|-----------|----------------|
| Equal visual weight | `KpiGrid` + `items-stretch` + shared min-height |
| Scannable hierarchy | Label → value → trend/caption, icon top-right |
| No horizontal scroll on mobile | `w-full min-w-0`, 2-column grid |
| Institutional density | Compact typography, no oversized cards or wasted whitespace |
| Consistent surfaces | Shared `statusCardSurfaceClass` across all KPI contexts |
