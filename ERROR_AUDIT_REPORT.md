# Error Audit Report

**Date:** 2026-07-06

---

## TypeScript Errors (Fixed)

### 1. `components/invest/InvestPlanCard.tsx`

```
Property 'title' does not exist on Lucide SVG props
```

**Cause:** Lucide React icons do not accept native `title` attribute.  
**Fix:** Tooltip via wrapping `<span title={...}>`.

### 2. `lib/motion/motion-card.tsx`

```
onDrag / onAnimationStart incompatible between HTML div and framer-motion m.div
```

**Cause:** Spreading `ComponentProps<'div'>` onto `m.div` merges conflicting event handler types.  
**Fix:** Explicit prop interface (`className`, `children`, `interactive` only).

### 3. `lib/motion/stagger.tsx`

```
onCopy incompatible between HTMLDivElement and HTMLUListElement when as="ul"
```

**Cause:** `StaggerContainer` spread `div` props onto `ul` motion element.  
**Fix:** Typed props limited to `children`, `className`, `as`, `aria-label`.

---

## Build Configuration

| Setting | Before | After |
|---------|--------|-------|
| `typescript.ignoreBuildErrors` | `true` | **Removed** |
| `tsc --noEmit` | 4 errors | **0 errors** |
| `npm run build` | Passed (errors ignored) | **Passes (strict)** |

---

## ESLint

| Check | Result |
|-------|--------|
| `npm run lint` | **Fails** — `eslint` not in `devDependencies` |
| Config file | **Missing** — no `eslint.config.js` or `.eslintrc` |

**Recommendation:** Add ESLint with Next.js config. Not blocking production deploy.

---

## Hydration / Runtime

| Area | Status |
|------|--------|
| `useSearchParams` in callback | Wrapped in `<Suspense>` ✅ |
| Locale routing | `next-intl` middleware ✅ |
| Supabase client SSR | Cookie handlers in middleware ✅ |

No new hydration errors identified in audited paths.

---

## API Error Handling

Webhook and verification routes return appropriate HTTP status codes (401/400/503/500) with structured logging. Payment webhooks use signature validation.

---

## Summary

| Category | Count Found | Count Fixed |
|----------|-------------|-------------|
| TypeScript errors | 4 | 4 |
| Build config issues | 1 | 1 |
| ESLint setup | 1 | 0 (documented) |
| Critical runtime bugs | 0 | — |

**All fixable compile-time errors resolved.**
