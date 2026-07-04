# Error Report

**Date:** July 5, 2026

---

## TypeScript Errors

| Status | Count |
|--------|-------|
| Before | 17 |
| After | **0** |

### Root Causes Fixed

1. **Duplicate `TransactionRow` types** — Unified in `lib/data/db-rows.ts`
2. **`PaymentProviderId` missing import** — Added to `lib/payments/service.ts`
3. **Middleware `activeUser` type mismatch** — Narrowed to `{ id: string } | null`
4. **`unknown` casts in queries** — Explicit casts for portfolio/wallet numeric fields
5. **Admin transaction patch** — Cast `row.amount` in `AdminTransactionsView.tsx`

### Recommendation

Remove `typescript.ignoreBuildErrors: true` from `next.config.mjs` — TypeScript is now clean and CI should enforce type safety.

---

## Hydration Warnings

| Location | Issue | Fix |
|----------|-------|-----|
| `dashboard/page.tsx` | `new Date()` in render | Client-only date via `useEffect` + `suppressHydrationWarning` |
| `AcademyPageView.tsx` | `new Date().toLocaleDateString()` in render | **Documented** — use stored completion date (follow-up) |
| `formatRelativeTime()` | Uses `Date.now()` | Safe when called post-mount in `useAsyncData` callbacks |

---

## React Warnings

| Item | Status |
|------|--------|
| Unstable effect deps (`AuthRedirectGuard`) | **Fixed** |
| `InvestModal` plan object dep | Documented — use `plan?.id` (follow-up) |
| `DashboardCommandMenu` listener rebinding | Documented — use refs (follow-up) |

---

## Console Output

| Type | Count in Source |
|------|-----------------|
| `console.log` | 0 |
| `console.error` (server API routes) | 24 files — appropriate error-path logging |

No debug logging in client components except `error.tsx` (acceptable).

---

## Runtime Crash Risks

| Pattern | Mitigation |
|---------|------------|
| Null user on dashboard | `useSessionUser()` + loading states |
| Empty wallet data | `AsyncState` + empty states on all wallet widgets |
| Transaction mapping | Required `id: string` on `TransactionDbRow` |

---

## Race Conditions

| Area | Status |
|------|--------|
| Auth redirect guard | Safety timer (4s) + cleanup on unmount |
| Async data fetch | `useAsyncData` abort on unmount |
| Deposit duplicate submit | Guard in deposit flow (prior pass) |

---

## Loading Loops

No infinite render loops identified. AuthRedirectGuard `redirectParam` fix prevents re-trigger loops from searchParams identity changes.
