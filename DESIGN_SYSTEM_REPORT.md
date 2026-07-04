# PrimeFx Invest — Design System Report

**Date:** July 4, 2026

---

## Core Tokens

| Module | Path | Usage |
|--------|------|-------|
| Surfaces | `lib/layout/surfaces.ts` | Cards, dashboard widgets, skeletons |
| Spacing | `lib/layout/spacing.ts` | Page/section stacks |
| Navigation | `lib/layout/nav-styles.ts` | Sidebar items, labels, touch targets |
| Logo | `lib/layout/logo.ts` | Canonical mark sizes |
| Cache keys | `lib/data/cache-keys.ts` | Cross-page data deduplication |
| Charts | `lib/layout/charts.ts` | Chart height constants |

---

## Component Library

### KPI System
```
components/shared/kpi/
├── KpiCard.tsx          # Metric surface
├── KpiGrid.tsx          # 4 | 5 responsive grid
├── InvestorKpiCards.tsx # Dashboard + wallet mapping
└── index.ts
```

### Auth System
```
components/auth/
├── AuthSplitShell.tsx
├── AuthFormShell.tsx
├── AuthHeroPanel.tsx
├── AuthInput.tsx
├── LoginForm.tsx / SignupForm.tsx
└── ...
```

### Rewards
```
components/rewards/
├── AchievementCard.tsx
└── RewardsSummaryKpis.tsx
```

---

## Card Hierarchy

| Level | Class | Padding |
|-------|-------|---------|
| Primary card | `cardSurfaceClass` / `dashboardCardClass` | `p-4 sm:p-5` |
| KPI card | `statusCardSurfaceClass` | `p-4 sm:p-5`, min-height enforced |
| Inner tile | `innerTileSurfaceClass` | `p-4` |

---

## Typography

| Role | Pattern |
|------|---------|
| Page title | `text-2xl font-bold tracking-tight sm:text-3xl` |
| Section | `SectionHeading` component |
| KPI value | `text-lg sm:text-xl lg:text-2xl font-bold` |
| Muted | `text-muted-foreground text-xs sm:text-sm` |

---

## Buttons & Inputs

- Primary CTA: shadcn `Button` `h-11` on auth/forms
- Nav touch targets: `min-h-11`
- Inputs: `rounded-xl border-border min-h-11`

---

## Loading & Empty States

- `AsyncState` wrapper with skeleton fallbacks
- `MetricCardsSkeleton` mirrors `KpiGrid` topology
- `EmptyState` / `ErrorState` from `components/shared/data-state.tsx`

---

## Consistency Rules

1. Prefer semantic tokens (`border-border`, `bg-card`) over `gray-200`
2. Use `KpiCard` for numeric metrics across dashboard, wallet, rewards, referral stats
3. Use `pageStackClass` / `sectionStackClass` for vertical rhythm
4. Use `LOGO_SIZES` presets — no ad-hoc pixel sizes
5. Use `CACHE_KEYS` for shared async data

---

## Migration Status

| Area | Token compliance |
|------|------------------|
| Dashboard | ✅ High |
| Wallet | ✅ High |
| Rewards | ✅ High |
| Referral | 🟡 Partial (main panels still some gray-* in charts/tables) |
| Admin | 🟡 Separate shell |
