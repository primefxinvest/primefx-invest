# Performance Report

**Date:** 2026-07-06

---

## Build & Bundle

| Metric | Result |
|--------|--------|
| Production build | ✅ ~218s (full compile) |
| Code splitting | ✅ `Invest.lazy.tsx` dynamic imports for invest components |
| Image optimization | `unoptimized: true` in config (static export compatibility) |

---

## React Patterns (Audited)

| Pattern | Status | Notes |
|---------|--------|-------|
| `useCallback` / `useMemo` on invest page | ✅ Used for handlers and view modes |
| Realtime subscriptions | ✅ Cleanup via `removeChannel` in `useVerificationRealtime` |
| Polling on callback | ✅ Cancelled on unmount (`cancelled` flag) |
| `useAsyncData` cache | ✅ Stable loader pattern with eslint exception documented |

---

## API Call Efficiency

| Area | Behavior |
|------|----------|
| Investment plans | `useInvestmentPlans` hook with reload |
| KYC status | Rate-limited API (`kyc:status` 120/hr) |
| Profile page | Single parallel fetch on load + silent refresh on events |
| Verification callback | Poll max 12× with 2s interval; stops on terminal status |

No duplicate-fetch bugs identified requiring code changes in this audit.

---

## Motion Performance

| Component | Optimization |
|-----------|--------------|
| `MotionCard` | `willChange: 'transform'`; disabled when `useReducedMotion()` |
| `StaggerContainer` | Skips animation when reduced motion preferred |
| Sidebar drawer | CSS `transform` transition (GPU-friendly) |

---

## Memory / Listener Leaks

| Source | Cleanup |
|--------|---------|
| Supabase realtime channels | `removeChannel` on effect cleanup ✅ |
| Window event listeners (profile) | Removed in effect return ✅ |
| Redirect timers (callback) | `clearTimeout` / `clearInterval` on cleanup ✅ |

---

## Recommendations (Non-blocking)

1. Consider lazy-loading `recharts` only on analytics pages if bundle size becomes a concern.
2. Add React DevTools profiler pass on dashboard for render count baseline.
3. Monitor Vercel Analytics for LCP on mobile post-deploy.

**Performance: ACCEPTABLE for production — no critical leaks or regressions found.**
