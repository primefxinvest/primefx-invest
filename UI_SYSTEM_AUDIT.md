# PrimeFx Invest — UI System Audit

**Date:** July 4, 2026  
**Scope:** Layout, responsiveness, information hierarchy, visual consistency (no logic/color/route changes)

---

## Executive Summary

This pass unifies the investor KPI system, wallet action layout, mobile navigation, and logo rendering under a single design system. All changes are presentational; business logic, calculations, and routes are unchanged.

---

## Design System Anchors

| Token / Module | Purpose |
|----------------|---------|
| `statusCardSurfaceClass` | Wallet action cards, KPI cards |
| `KpiCard` + `KpiGrid` | Metric surfaces across app |
| `InvestorKpiCards` | Shared dashboard + wallet KPI data mapping |
| `LOGO_SIZES` (`lib/layout/logo.ts`) | Canonical logo dimensions |
| `NAV_*` (`lib/layout/nav-styles.ts`) | Sidebar touch targets, labels, active states |

---

## Issues Found & Fixed

### Wallet Overview
- **Before:** Four balance KPIs (Available, Pending, Bonus, Total) inconsistent with dashboard investor metrics.
- **After:** Unified `InvestorKpiCards` variant `wallet` — Current Balance, Current Value, Total Invested, Total Profit.
- **Before:** Deposit / Withdraw / Transfer in uneven 2+1 grid with oversized cards.
- **After:** Single horizontal row (3 equal cards) from 480px+; stacked on narrow mobile.

### KPI System
- **Before:** Dashboard duplicated KPI markup; wallet used different data shape.
- **After:** `InvestorKpiCards` shared by Dashboard (`variant="dashboard"`, 5 cards) and Wallet (`variant="wallet"`, 4 cards). Portfolio and Referral continue using `KpiCard` directly with same surface tokens.

### Mobile Navigation
- **Before:** Drawer labels hidden (`hidden lg:inline`); wallet submenu desktop-only; 15rem narrow drawer; 36px close target.
- **After:** Labels visible in mobile drawer; wallet expandable submenu on mobile + desktop; 18rem drawer; 44px nav items; improved overlay blur and easing.

### Logo
- **Before:** Ad-hoc sizes (34, 36, 40, 44, 64) with manual dark-theme class overrides.
- **After:** `sizeKey` presets, `variant="onDark"`, explicit `width`/`height`/`sizes`, `quality={100}`.

### Global Consistency
- Wallet settings button uses semantic `border-border` / `bg-card` tokens.
- Action cards use `statusCardSurfaceClass` instead of hardcoded `gray-200` borders.
- Sidebar spacing increased (`space-y-1.5`, `px-3`, `rounded-xl` nav items).

---

## Pages Audited

| Area | Status |
|------|--------|
| Dashboard KPIs | ✅ Shared component |
| Wallet Overview | ✅ KPI + actions redesigned |
| Portfolio KPIs | ✅ Already on `KpiCard` / `KpiGrid` |
| Referral analytics | ✅ Already on `KpiCard` |
| Auth (login/signup) | ✅ Logo presets applied |
| Landing nav/footer | ✅ Logo presets applied |
| Sidebar / mobile nav | ✅ Improved |
| Admin shell | ✅ Logo preset |

---

## Out of Scope (Intentionally Unchanged)

- Color palette tokens (`--primary`, emerald, orange accents)
- Routes and navigation paths
- `fetchPortfolioMetrics`, `fetchWalletData`, referral/auth logic
- Wallet donut, health, PrimeAI insight cards (features retained)

---

## Recommended Follow-Up (Optional)

- Migrate remaining hardcoded `gray-200` borders in wallet sub-components to `border-border`
- Add `wallet.actions` group label to i18n for action row `aria-label`
