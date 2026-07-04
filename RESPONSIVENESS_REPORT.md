# Responsiveness Report

**Date:** July 5, 2026  
**Breakpoints tested:** 320 · 375 · 390 · 414 · 768 · 1024 · 1280 · 1440 · 1920

---

## Fixes Applied

### Horizontal overflow prevention

Added `min-w-0` to page roots on Dashboard, Invest, and Wallet. Portfolio already had this pattern.

Prevents flex/grid children from forcing horizontal scroll inside the fixed `main` container.

### Invest plans table

Wrapped desktop table in `ScrollTable` with `min-w-[720px]`.

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Mobile card list (unchanged) |
| 768–1024px | Horizontal scroll table (new) |
| ≥ 1024px | Full table visible |

### Navbar ↔ content alignment

`pagePaddingXClass` ensures consistent horizontal inset at all breakpoints:

```
px-4 (320–639) → sm:px-5 (640–1023) → lg:px-6 (1024+)
```

### Chart axis clipping

`MonthlyReturnsChart` left margin changed from `-20` to `0`. Y-axis labels no longer clip on 320–414px widths.

### Portfolio tables

Header padding unified to `px-5` — column headers align with body cells at all widths.

---

## Sidebar Responsiveness

| Breakpoint | Width | Logo |
|------------|-------|------|
| < md | `min(18rem, 88vw)` | Full PrimeFx INVEST wordmark |
| md–lg | `4.5rem` icon rail | Icon only |
| ≥ lg | `13rem (w-52)` | Full wordmark |

Mobile drawer: full branding, 36px mark, vertically centered in 60px header.

---

## Grid Behavior

| Page | Grid | Gap Token |
|------|------|-----------|
| Dashboard | 1 → 3 cols | `gridGapClass` |
| Wallet balances | 1 → 2 → 3 cols | `gridGapClass` |
| Wallet activity | 1 → xl:2 cols | `gridGapClass` |
| Invest plans | 1 → 2 → 4 cols | `gap-4` (inner) |

---

## Touch Targets

| Element | Size | Compliant |
|---------|------|-----------|
| Mobile menu button | `min-h-11 min-w-11` (44px) | ✅ |
| Nav icon buttons | `h-9 w-9` (36px) | ⚠️ Acceptable for secondary actions |
| Invest mobile CTA | `py-2.5` full width | ✅ |
| Sidebar nav items | `min-h-11` | ✅ |

---

## Known Patterns

- Market Insights carousel uses `-mx-4` bleed — intentional, matches page padding
- Deposit flow: stacked cards on mobile, side-by-side on lg+ (prior pass)
- Auth pages: mobile hero + form stack below `lg` breakpoint

---

## Breakpoint Checklist

| Width | Status |
|-------|--------|
| 320px | ✅ No horizontal scroll on core pages |
| 375px | ✅ Mobile drawer + form layouts intact |
| 390px | ✅ Same |
| 414px | ✅ Same |
| 768px | ✅ Invest table scrolls; sidebar icon rail |
| 1024px | ✅ Full sidebar wordmark; 3-col grids |
| 1280px | ✅ Dashboard xl layout |
| 1440px | ✅ Content max-width respected |
| 1920px | ✅ Sidebar offset correct; no stretch |
