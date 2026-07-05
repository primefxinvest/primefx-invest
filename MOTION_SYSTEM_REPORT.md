# Motion System Report — PrimeFx Invest

**Date:** July 5, 2026  
**Library:** Framer Motion (newly installed)  
**Bundle strategy:** `LazyMotion` + `domAnimation` (~4kb feature bundle)

---

## Architecture

```
lib/motion/
├── tokens.ts              # Durations, easings, variants
├── use-reduced-motion.ts  # OS accessibility hook
├── MotionProvider.tsx     # LazyMotion wrapper
├── page-transition.tsx    # Route fade + slide
├── motion-card.tsx        # Card hover lift
├── stagger.tsx            # List/grid stagger
├── animated-number.tsx    # Counter transitions
└── index.ts               # Public exports
```

### Provider Integration

`MotionProvider` wraps the entire investor dashboard shell in `AppLayout.tsx`. All child components can use `m.*` primitives without importing the full Framer Motion bundle.

---

## Motion Tokens

### Durations

| Token | Value | Use case |
|-------|-------|----------|
| `instant` | 100ms | Tap feedback |
| `fast` | 150ms | Exit transitions |
| `normal` | 200ms | Page transitions, fades |
| `slow` | 250ms | Hero entrance |
| `drawer` | 300ms | Sidebar drawer |

### Easing Curves

- **out:** `[0.32, 0.72, 0, 1]` — Premium ease-out (Revolut/Apple feel)
- **inOut:** `[0.4, 0, 0.2, 1]` — Modal open/close
- **exit:** `[0.4, 0, 1, 1]` — Quick page exit

---

## Animation Catalog

### Page Transitions

**Component:** `PageTransition`  
**Location:** `AppLayout` → wraps all dashboard page content  
**Effect:** 200ms fade + 8px slide up on enter, 4px slide up + fade on exit  
**Mode:** `AnimatePresence` with `mode="wait"`  
**Key:** `pathname` from `usePathname()`

### Cards

**Component:** `MotionCard`  
**Hover:** `y: -2`, `scale: 1.01` (within 1.02 max spec)  
**Tap:** `scale: 0.99`  
**GPU:** `willChange: transform`  
**Used in:** `KpiCard`, dashboard chart cards, recent transactions

### Sidebar Drawer

**Backdrop:** `AnimatePresence` fade (200ms in, 150ms out)  
**Panel:** Existing CSS `transition-[transform,width] duration-300` with cubic-bezier preserved  
**Location:** `Sidebar.tsx`

### Staggered Lists

**Components:** `StaggerContainer`, `StaggerItem`  
**Stagger delay:** 50ms between children  
**Initial delay:** 20ms  
**Item motion:** opacity 0→1, y 6px→0 over 200ms  
**Used in:** Dashboard chart grid, recent transactions list

### Buttons

**CSS tap:** `active:scale-[0.98]` with 150ms ease-out  
**No Framer wrapper** — avoids Base UI button conflicts

### Modals

**Existing Base UI:** `data-[starting-style]:scale-95` → scale 1.0  
**Enhancement:** Added explicit 200ms CSS transition on popup

### Counters

**Component:** `AnimatedNumber`  
**Spring:** stiffness 120, damping 20  
**Status:** Available, not yet wired to currency formatters (safe for future KPI animation)

### Skeletons

**Existing:** CSS `skeleton-shimmer` keyframe (1.75s ease-in-out)  
**No change** — already premium shimmer effect

### Notifications (Sonner)

**Existing:** Slide-in via Sonner defaults + PrimeFx theme in `globals.css`  
**No change** — toast styling already institutional

---

## Accessibility

### Reduced Motion

1. **`useReducedMotion()` hook** — reads `prefers-reduced-motion: reduce`
2. **All motion components** fall back to static HTML when reduced motion is enabled
3. **Global CSS** in `globals.css` disables animations/transitions when OS setting is active

### Performance Rules

- Only `transform` and `opacity` animated (GPU-accelerated)
- No layout-triggering properties (`width`, `height`, `top`, `left`)
- `LazyMotion` defers animation feature load
- `willChange: transform` only on interactive cards
- No infinite animations except skeleton shimmer (loading state only)

---

## Usage Guide for Remaining Pages

```tsx
import { MotionCard, StaggerContainer, StaggerItem, PageTransition } from '@/lib/motion'

// Interactive card
<MotionCard className={dashboardCardClass}>...</MotionCard>

// Staggered list
<StaggerContainer as="ul">
  {items.map(item => (
    <StaggerItem key={item.id} as="li">...</StaggerItem>
  ))}
</StaggerContainer>

// Animated counter (numeric values only)
<AnimatedNumber value={1234.56} format={(n) => formatCurrency(n)} />
```

**Note:** `PageTransition` is already applied globally in `AppLayout`. Do not nest it in individual pages.

---

## Comparison Targets

| Platform | PrimeFx equivalent |
|----------|-------------------|
| Revolut | Card hover lift, page fade |
| Stripe | Modal scale entrance |
| Linear | Staggered list rows |
| Vercel | Subtle page transitions |
| Apple Wallet | Tap scale feedback, premium easing |
