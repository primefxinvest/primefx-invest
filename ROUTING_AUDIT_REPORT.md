# PrimeFx Routing Audit Report

**Date:** July 4, 2026  
**Scope:** Full application routing — navigation links, page files, middleware, auth redirects  
**Goal:** No navigation item should lead to a 404

---

## Executive Summary

All six reported routes (`/login`, `/signup`, `/about`, `/invest`, `/community`, `/market-insights`) **already have page components** in the codebase. Production builds resolve them correctly. The 404 symptoms were caused by:

1. **Stale Next.js dev server** — an old `next dev` process served 404 for all non-index `[locale]` sub-routes while `/` still worked.
2. **Hash-only links using i18n `Link`** — footer anchor links (`#features`, `#pricing`) and hero `#how-it-works` could mis-route through next-intl instead of scrolling on the landing page.

Fixes applied: hash link corrections, guest-aware landing nav for protected routes, locale-aware logout redirect, and a reusable `ComingSoonPage` for any future missing routes.

---

## Existing Routes (30 locale-scoped pages)

| Route | Page file | Access |
|-------|-----------|--------|
| `/` | `app/[locale]/(marketing)/page.tsx` | Public |
| `/login` | `app/[locale]/(auth)/login/page.tsx` | Public (auth) |
| `/signup` | `app/[locale]/(auth)/signup/page.tsx` | Public (auth) |
| `/2fa-verify` | `app/[locale]/(auth)/2fa-verify/page.tsx` | Public (auth) |
| `/about` | `app/[locale]/(public)/about/page.tsx` | Public |
| `/contact` | `app/[locale]/(public)/contact/page.tsx` | Public |
| `/legal` | `app/[locale]/(public)/legal/page.tsx` | Public |
| `/terms` | `app/[locale]/(public)/terms/page.tsx` | Redirect → `/legal#terms` |
| `/privacy` | `app/[locale]/(public)/privacy/page.tsx` | Redirect → `/legal#privacy` |
| `/dashboard` | `app/[locale]/(dashboard)/dashboard/page.tsx` | Authenticated |
| `/invest` | `app/[locale]/(dashboard)/invest/page.tsx` | Authenticated |
| `/portfolio` | `app/[locale]/(dashboard)/portfolio/page.tsx` | Authenticated |
| `/wallet` (+ deposit/withdraw/transfer) | `app/[locale]/(dashboard)/wallet/**` | Authenticated |
| `/transactions` | `app/[locale]/(dashboard)/transactions/page.tsx` | Authenticated |
| `/primeai` | `app/[locale]/(dashboard)/primeai/page.tsx` | Authenticated |
| `/academy` (+ `[courseId]`) | `app/[locale]/(dashboard)/academy/**` | Authenticated |
| `/rewards` | `app/[locale]/(dashboard)/rewards/page.tsx` | Authenticated |
| `/community` | `app/[locale]/(dashboard)/community/page.tsx` | Authenticated |
| `/referral` | `app/[locale]/(dashboard)/referral/page.tsx` | Authenticated |
| `/market-insights` | `app/[locale]/(dashboard)/market-insights/page.tsx` | Authenticated |
| `/support` | `app/[locale]/(dashboard)/support/page.tsx` | Authenticated |
| `/notifications` | `app/[locale]/(dashboard)/notifications/page.tsx` | Authenticated |
| `/settings` | `app/[locale]/(dashboard)/settings/page.tsx` | Authenticated |
| `/profile` | `app/[locale]/(dashboard)/profile/page.tsx` | Authenticated |
| `/verify` (+ callback) | `app/[locale]/(dashboard)/verify/**` | Authenticated |

**Admin routes** (locale-exempt): `/admin`, `/admin/users`, `/admin/kyc`, etc.

**Auth API routes** (locale-exempt): `/auth/callback`, `/auth/login/google`, `/auth/signout`

---

## Reported Routes — Status

| Route | Page exists? | Nav references | Runtime behavior (production) |
|-------|--------------|----------------|-------------------------------|
| `/login` | Yes | LandingNav, AuthLayoutNav, middleware | 200 — login form |
| `/signup` | Yes | LandingNav, AuthLayoutNav, CTAs | 200 — signup form |
| `/about` | Yes | LandingNav, LandingFooter, Sidebar | 200 — about content |
| `/invest` | Yes | LandingNav, dashboard, academy | 307 → `/login?redirect=/invest` (guest) |
| `/community` | Yes | LandingNav, LandingFooter, Sidebar | 307 → `/login?redirect=/community` (guest) |
| `/market-insights` | Yes | LandingNav, PerformanceSection | 307 → `/login?redirect=/market-insights` (guest) |

**No placeholder pages were created** for these routes because all page components already exist.

---

## Missing Routes

**None** among navigation-referenced paths.

---

## Broken Navigation Items (Fixed)

| Location | Issue | Fix |
|----------|-------|-----|
| `LandingFooter.tsx` | `#features`, `#pricing` used i18n `Link` | Changed to `<a href="/#features">` and `<a href="/#pricing">` |
| `HeroSection.tsx` | `#how-it-works` used i18n `Link` | Changed to `<a href="/#how-it-works">` |
| `LandingNav.tsx` | Guest clicks on protected nav items hit middleware redirect chain | Guest links now go to `/signup?redirect=…` for protected items |
| `lib/auth/logout.ts` | Hard-coded `/login` ignored locale prefix | Uses `localizePath('/login', locale)` |

---

## Missing Page Components

**None** for reported routes or primary navigation.

A reusable **`ComingSoonPage`** component was added at `components/shared/ComingSoonPage.tsx` for future nav-referenced routes that lack a page.

---

## Redirect and Middleware Analysis

### Architecture

- **i18n:** next-intl with `[locale]` segment, `localePrefix: 'as-needed'`
- **Middleware:** next-intl middleware + Supabase `updateSession`
- **Route guards:** `lib/auth/routes.ts`

### Auth redirect flow

| Scenario | Behavior |
|----------|----------|
| Guest → protected route | Middleware → `/login?redirect=<path>` |
| Guest → `/login` | Page renders |
| Authenticated → `/login` | Middleware → `/dashboard` (or redirect param / MFA) |
| Authenticated + pending MFA → protected | Middleware → `/2fa-verify?redirect=<path>` |

**No redirect loops detected.**

### Dev server note

If sub-routes under `[locale]` return 404 while `/` works, restart dev:

```bash
rm -rf .next && npm run dev
```

---

## Constraints Respected

- Dashboard routes — not modified
- Wallet routes — not modified
- Investment logic — not modified
- Authentication providers — not modified
- Database schema — not modified

---

## Verification

```bash
npm run build   # All 30 locale routes listed in build output
npm run start   # /login, /about, /signup, /es/login → 200
```
