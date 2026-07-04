# Accessibility, Performance & Design System Report

**Date:** July 4, 2026  
**Scope:** Presentation-layer improvements only — no business logic, API, auth, payment, or schema changes.

---

## Summary

Established shared design tokens, improved accessibility across the dashboard shell and key pages, and reduced duplicate network work and initial bundle weight through caching and code splitting.

---

## Files Modified

### New files (design system & performance)

| File | Purpose |
|------|---------|
| `lib/layout/surfaces.ts` | Shared card surface tokens |
| `lib/layout/spacing.ts` | Page/section spacing tokens |
| `lib/hooks/async-cache.ts` | In-memory request dedup + TTL cache |
| `components/shared/SectionHeading.tsx` | Unified section labels |
| `components/shared/PageSection.tsx` | Section wrapper with heading |
| `components/shared/SkipLink.tsx` | Skip to main content link |
| `components/shared/Charts.lazy.tsx` | Dynamic Recharts (dashboard) |
| `components/portfolio/Charts.lazy.tsx` | Dynamic portfolio charts |

### Updated files

| Area | Files |
|------|-------|
| **Layout / shell** | `AppLayout.tsx`, `Navbar.tsx`, `Sidebar.tsx`, `ScrollTable.tsx`, `status-cards.tsx`, `skeletons.tsx` |
| **Hooks** | `useAsyncData.ts` |
| **UI primitives** | `custom-select.tsx` |
| **Pages** | `rewards`, `settings`, `profile`, `community`, `notifications`, `market-insights`, `dashboard`, `portfolio`, `wallet` |
| **Wallet** | `WalletBalanceCards.tsx`, `WalletBalanceDonut.tsx` |

---

## Components Modified

### Design system cleanup

- **`cardSurfaceClass`**, **`statusCardSurfaceClass`**, **`skeletonCardSurfaceClass`** — single source in `lib/layout/surfaces.ts`
- **`pageStackClass`** (`space-y-8`), **`sectionStackClass`** (`space-y-3`) — `lib/layout/spacing.ts`
- **`SectionHeading`** — extracted from 7 duplicated local implementations
- **`status-cards.tsx`** — re-exports surfaces; semantic tokens aligned (`border-border bg-card`)
- **`skeletons.tsx`** — uses shared skeleton card token
- Migrated pages: rewards, settings, profile, community, notifications, market-insights

### Accessibility

| Improvement | Location |
|-------------|----------|
| Skip to main content link | `AppLayout.tsx` + `SkipLink.tsx` |
| `#main-content` landmark with focus target | `AppLayout.tsx` |
| Sidebar `aria-label="Main navigation"` | `Sidebar.tsx` |
| Nav region label | `Sidebar.tsx` |
| Profile link `aria-label` on mobile | `Navbar.tsx` |
| Decorative avatar `alt=""` + parent label | `Navbar.tsx` |
| `CustomSelect` `ariaLabel` / `ariaLabelledBy` / clear button label | `custom-select.tsx` |
| Search input label in select dropdown | `custom-select.tsx` |
| Community search `sr-only` label | `community/page.tsx` |
| Settings toggles via `<label htmlFor>` | `settings/page.tsx` |
| Progress bars `role="progressbar"` + ARIA values | `rewards/page.tsx` |
| Notification buttons `aria-label` with unread state | `notifications/page.tsx` |
| Table headers `scope="col"` | `profile/page.tsx` |
| Scrollable table region label + keyboard focus | `ScrollTable.tsx` |
| Sentiment icons with `sr-only` text | `market-insights/page.tsx` |
| Community engagement counts with screen reader text | `community/page.tsx` |
| Wallet section `aria-label` | `wallet/page.tsx` |

### Performance

| Improvement | Impact |
|-------------|--------|
| **`useAsyncData` cache** with `cacheKey` | Dedupes in-flight + cached results (30s TTL) |
| **`user-notifications` cache** shared by Navbar + Sidebar | **−1 duplicate fetch** per dashboard load |
| **`wallet-data` cache** shared by balance cards + donut | **−1 duplicate fetch** on wallet page |
| Cache invalidation on notification read | Keeps badge count accurate |
| **Dynamic import** dashboard charts (`Charts.lazy.tsx`) | Smaller initial dashboard JS |
| **Dynamic import** portfolio charts | Smaller initial portfolio JS |
| **Dynamic import** `DashboardCommandMenu` | Command palette loaded on demand |
| Avatar `loading="lazy"` + explicit dimensions | Better LCP / layout stability |

---

## Risks Introduced

| Risk | Severity | Mitigation |
|------|----------|------------|
| Async cache may serve stale data for up to 30s | Low | `reload()` and explicit invalidation clear cache |
| Dynamic charts flash skeleton briefly | Low | Matching `ChartCardSkeleton` loaders |
| Skip link visible on focus only | None | Standard WCAG pattern |
| Semantic token swap on status cards (gray → border-border) | None | Same computed colors in theme |

Build passes.

---

## Backend Impact

**None.**

- No API routes, database schemas, auth, or payment logic modified
- Cache is client-side only
- Same data loaders; fewer duplicate calls

---

## Performance Impact

**Positive.**

- ~2 fewer Supabase round-trips on typical dashboard navigation (notifications)
- ~1 fewer on wallet page (wallet data)
- Recharts deferred on dashboard/portfolio routes
- Command menu deferred until needed
- Reduced duplicate component definitions → smaller diffs and faster future changes

---

## Maintainability Impact

**Positive.**

- Single import path for section headings and card surfaces
- Spacing tokens document page rhythm
- `PageSection` available for future pages
- `CustomSelect` accessibility props reusable at all call sites

---

## Remaining opportunities (not in scope)

- Accessible modal wrapper for custom overlays (support, invest, wallet modals)
- Full session context merge (user + tier)
- `React.memo` on list row components
- Chart `role="img"` summaries for screen readers
- Referral page `SectionHeading` migration

---

## Verification

- [x] No business logic changes
- [x] No API / auth / payment changes
- [x] Design tokens centralized
- [x] Skip link + main landmark
- [x] Request deduplication for notifications + wallet
- [x] Chart code splitting on dashboard + portfolio
- [x] `npm run build` — success
