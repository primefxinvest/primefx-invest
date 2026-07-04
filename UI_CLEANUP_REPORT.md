# UI Cleanup Report

**Date:** July 5, 2026

---

## Objective

One single design system across the entire PrimeFx Invest platform.

---

## Token Adoption

| Token | Purpose | Pages Updated |
|-------|---------|---------------|
| `min-w-0` | Prevent horizontal overflow in fixed main | Dashboard, Invest, Wallet |
| `gridGapClass` | Consistent card grid spacing | Dashboard, Wallet |
| `pageHeaderGapClass` | Page title row alignment | Invest, WalletPageHeader |
| `dashboardMutedTextClass` | Subtitle typography | Invest, WalletPageHeader |
| `dashboardCardClass` | Card surfaces | WalletBalanceDonut, WalletHealthCard |
| `pagePaddingXClass` | Navbar ↔ content alignment | Navbar |

---

## Page Header Normalization

**Before:** Invest used `text-2xl text-gray-900`; Wallet used `text-2xl sm:text-3xl text-gray-900`.

**After:** Both use dashboard pattern:

```
text-xl font-bold tracking-tight text-foreground sm:text-2xl
```

WalletPageHeader rewritten to match Dashboard header structure.

---

## Overflow Fixes

| Issue | Fix | File |
|-------|-----|------|
| Page root overflow | `min-w-0` on root wrapper | `dashboard/page.tsx`, `invest/page.tsx`, `wallet/page.tsx` |
| Invest table clip on tablet | `ScrollTable` + `min-w-[720px]` | `InvestPlansTable.tsx` |
| Chart Y-axis clip | `margin.left: 0` (was `-20`) | `MonthlyReturnsChart.tsx` |
| Portfolio table misalignment | Unified `px-5` on table headers | `portfolio/page.tsx` |

---

## Wallet Card Migration

| Component | Before | After |
|-----------|--------|-------|
| WalletBalanceDonut | `border-gray-200 bg-white p-5` | `dashboardCardClass` |
| WalletHealthCard | Gray ad-hoc card | `dashboardCardClass` + `text-foreground` |

---

## Navbar Alignment

Navbar horizontal padding now matches main content:

```
pagePaddingXClass = px-4 sm:px-5 lg:px-6
```

Eliminates visual misalignment between top bar and page content on mobile/sm breakpoints.

---

## Remaining Inconsistencies (Low Priority)

- Tablet sidebar icon-only rail (intentional space constraint)
- Some wallet subcomponents (PaymentMethodsCard, WalletActivitySummary) still use gray palette — migrate in next pass
- PrimeAI chat page uses custom layout — no token migration needed yet

---

## Accessibility Notes

- Invest table rows: keyboard accessible (`role="button"`, Enter/Space)
- ScrollTable: `role="region"` + `aria-label` for screen readers
- Nav buttons: `min-h-11 min-w-11` on mobile menu (≥44px touch target)
