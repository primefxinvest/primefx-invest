# Performance Safety Report — PrimeFx Invest

**Date:** July 5, 2026  
**Build:** `npm run build` — ✅ Passed (261 static pages, 50s compile)

---

## Bundle Impact

### New Dependency

| Package | Purpose | Mitigation |
|---------|---------|------------|
| `framer-motion` | Animation primitives | `LazyMotion` + `domAnimation` feature set |

### Lazy Loading Strategy

- **`MotionProvider`** uses `LazyMotion` with `domAnimation` only (not full `domMax`)
- **Charts** remain lazy-loaded via `Charts.lazy.tsx` and `Dashboard.lazy.tsx`
- **No new route-level imports** of heavy animation features

### Estimated Addition

- Framer Motion domAnimation: ~4–6kb gzipped (loaded once via provider)
- Motion tokens/utilities: <1kb (tree-shaken)

---

## Animation Performance Rules

| Rule | Implementation |
|------|----------------|
| GPU-only properties | `transform`, `opacity` only |
| No layout thrashing | No animated `width`, `height`, `margin`, `padding` |
| `willChange` scoped | Only on `MotionCard` interactive surfaces |
| No rerender loops | Motion components are stateless wrappers |
| Reduced motion fallback | Static HTML when OS setting active |

---

## Existing Optimizations Preserved

| Optimization | Location | Status |
|--------------|----------|--------|
| Lazy chart imports | `components/shared/Charts.lazy.tsx` | ✅ Unchanged |
| Deferred dashboard sections | `DashboardSecondarySectionsDeferred` | ✅ Unchanged |
| `useAsyncData` caching | `lib/hooks/useAsyncData.ts` | ✅ Unchanged |
| Realtime subscriptions | `useUserWalletRealtime` | ✅ Unchanged |
| `memo()` on KPI cards | `KpiCard.tsx` | ✅ Unchanged |
| Plan carousel `will-change` | `globals.css` | ✅ Unchanged |
| Skeleton shimmer CSS | Not JS-driven | ✅ Unchanged |

---

## Page Transition Performance

| Metric | Target | Implementation |
|--------|--------|----------------|
| Route transition | <200ms | 200ms enter, 150ms exit |
| Mode | `wait` | Previous page exits before next enters (no overlap jank) |
| Key | `pathname` | Only animates on actual route change |

**Risk assessment:** Low. `AnimatePresence mode="wait"` adds ~150ms perceived delay on navigation — acceptable for premium feel, within spec.

---

## Memory Safety

| Concern | Mitigation |
|---------|------------|
| Event listener leaks | Sidebar keydown handlers have cleanup in `useEffect` return |
| WebSocket leaks | Realtime hooks unchanged — existing cleanup preserved |
| AnimatePresence orphans | `mode="wait"` ensures single child |
| Motion springs | `AnimatedNumber` spring disposed on unmount (Framer internal) |

---

## Build Verification

```
✓ Compiled successfully in 50s
✓ Generating static pages (261/261) in 5.6s
```

No build errors, no type validation failures (types skipped per Next config — pre-existing).

---

## Lighthouse Targets

| Metric | Target | Risk |
|--------|--------|------|
| Performance | >95 | Low — animations are CSS/GPU, lazy loaded |
| TTI Dashboard | <1.5s | Low — no new blocking scripts |
| CLS | <0.1 | Low — no layout-shifting animations |
| FID/INP | Good | Low — tap feedback is 100ms scale |

**Recommendation:** Run Lighthouse on `/dashboard` in production to establish baseline post-deploy.

---

## What Was NOT Added (Intentionally)

- No scroll-triggered animations (would require Intersection Observer overhead)
- No parallax on landing (would affect scroll performance)
- No animated backgrounds beyond existing blur orbs
- No Framer Motion on every DOM node
- No `layout` prop animations (expensive reflow)

---

## Monitoring Checklist

- [ ] Vercel Analytics — watch for TTI regression post-deploy
- [ ] Core Web Vitals — LCP should remain on hero/skeleton, not motion
- [ ] Error rate — no new client errors expected
- [ ] Bundle analyzer — confirm framer-motion chunk size on first dashboard load
