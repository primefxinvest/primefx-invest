# Portfolio UI Audit — PrimeFx Invest

**Date:** July 4, 2026  
**Scope:** Portfolio page layout and information architecture  
**Status:** Redesigned (layout/IA only)

---

## Executive Summary

The Portfolio page previously felt incomplete: four KPIs, two charts, investment tables, and a returns section without clear investor hierarchy. It has been restructured into eight investor-focused sections with premium spacing, equal card heights, and responsive grids—aligned with Binance Portfolio, Coinbase Assets, and TradingView patterns.

---

## Before vs After

### Before

1. Page header
2. 4 KPI cards (Current Value, P/L, Total Invested, ROI)
3. Performance chart + Allocation donut (2-col)
4. Active + Completed investment tables (2-col)
5. Monthly returns + Best performing asset (2-col)

**Gaps:** No timeline, no risk analysis, no recent activity, no geographic distribution surfaced, missing Active Plans KPI, latent `cn()` import bug.

### After — Information Architecture

| # | Section | Desktop | Mobile |
|---|---------|---------|--------|
| 1 | Portfolio Summary KPI Row | 1×5 row | 2×2 grid + full-width 5th |
| 2 | Portfolio Performance Chart | 7/12 width | Stacked full width |
| 3 | Asset Allocation Chart | 5/12 width | Stacked full width |
| 4 | Active Investments Table | Full width | Horizontal scroll table |
| 5 | Investment Timeline | 1/3 analytics row | Stacked |
| 6 | Profit Distribution | 1/3 analytics row | Stacked |
| 7 | Risk Exposure Analysis | 1/3 analytics row | Stacked |
| 8 | Recent Portfolio Activity | 1/3 activity row | Stacked |

**Retained features (not removed):**

- Completed Investments table
- Best Performing Asset highlight
- Portfolio Distribution map (`DistributionMap`)
- Capital withdrawal actions

---

## KPI Row Specification

| Metric | Source | Notes |
|--------|--------|-------|
| Total Portfolio Value | `overview.currentValue` | Primary hero metric |
| Total Invested | `overview.totalInvested` | Capital deployed |
| Total Profit | `overview.profitLoss` | Color-coded gain/loss |
| ROI | `overview.roi` | Signed color treatment |
| Active Plans | `overview.activePlans` | Count of running plans |

---

## New Components

| Component | Purpose |
|-----------|---------|
| `PortfolioInvestmentTimeline.tsx` | Visual timeline from active/completed investments + withdrawal requests |
| `PortfolioRiskExposure.tsx` | Risk bucket bars derived from active plan risk labels |
| `PortfolioRecentActivity.tsx` | Last 6 portfolio transactions via existing `fetchRecentTransactions` |

All data sourced from existing queries—no backend or calculation changes.

---

## Layout System

- `pageStackClass` — 32px section rhythm
- `gridGapClass` — 16px mobile / 24px desktop card gaps
- `dashboardCardClass` — unified card surfaces
- Equal minimum heights: `min-h-[280px]` analytics cards, `min-h-[380px]` chart row

---

## Files Modified / Added

| Path | Action |
|------|--------|
| `app/[locale]/(dashboard)/portfolio/page.tsx` | Full layout restructure |
| `components/portfolio/PortfolioInvestmentTimeline.tsx` | Added |
| `components/portfolio/PortfolioRiskExposure.tsx` | Added |
| `components/portfolio/PortfolioRecentActivity.tsx` | Added |
| `components/portfolio/DistributionMap.tsx` | Token alignment |
| `components/portfolio/MonthlyReturnsChart.tsx` | Accessible title for nested use |
| `components/shared/kpi/KpiGrid.tsx` | Improved 5-card mobile 2×2 behavior |

---

## Constraints Verified

- [x] No route changes
- [x] No backend logic changes
- [x] No investment calculation changes
- [x] No authentication changes
- [x] No feature removal
- [x] PrimeFx colors preserved

---

## Target Quality Alignment

| Reference | Pattern Applied |
|-----------|-----------------|
| TradingView | Performance chart prominence, period selector |
| Binance Portfolio | KPI row + allocation + holdings table |
| Coinbase Assets | Clean card hierarchy, muted labels |
