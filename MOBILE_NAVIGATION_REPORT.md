# PrimeFx Invest — Mobile Navigation Report

**Date:** July 4, 2026

---

## Components

| Component | Role |
|-----------|------|
| `Sidebar.tsx` | Primary drawer (mobile + tablet rail + desktop) |
| `MobileBottomNav.tsx` | Fixed bottom tab bar (< md) |
| `MobileNavContext.tsx` | Open/close state, body scroll lock |
| `Navbar.tsx` | Menu trigger + search |

---

## Drawer Improvements

### Width
- **Before:** `w-[min(15rem,80vw)]`
- **After:** `w-[min(18rem,88vw)]` — closer to Revolut/Binance readable drawer width

### Animation
- Transform easing: `cubic-bezier(0.32,0.72,0,1)` (300ms)
- Shadow: `shadow-2xl` when open
- Overlay: `bg-gray-900/50 backdrop-blur-[2px]`

### Touch Targets
- Nav items: `min-h-11` (44px) via `NAV_ITEM_BASE`
- Close button: `min-h-11 min-w-11`
- Sub-items: `min-h-10`
- Bottom nav links: `min-h-11` inside `h-16` bar

### Labels & Hierarchy
- **Fix:** `NAV_LABEL_CLASS` = `max-md:inline md:hidden lg:inline`
  - Mobile drawer: full text labels
  - Tablet rail: icon-only (sr-only / title)
  - Desktop: full labels
- **Fix:** Wallet submenu visible in mobile drawer (`NAV_WALLET_SUBMENU_CLASS`)
- **Fix:** Wallet toggle button on mobile + desktop; icon-only link on tablet rail
- Logout label visible in mobile drawer

### Active States
- Primary nav: `bg-[#0052ff] text-white`
- Sub-nav: `bg-blue-50 text-[#0052ff] font-semibold`
- Bottom nav: top accent bar + `stroke-[2.25]` on active icon

### Interaction
- Body scroll locked when drawer open
- Escape closes drawer
- Focus trap when open
- Auto-close on route change

---

## Bottom Navigation

| Item | Route |
|------|-------|
| Dashboard | `/dashboard` |
| Invest | `/invest` |
| Portfolio | `/portfolio` |
| Wallet | `/wallet/*` |
| More | Opens sidebar drawer |

Safe-area: `pb-[env(safe-area-inset-bottom)]`

---

## QA Checklist

- [x] 44px minimum touch targets
- [x] Labels readable in mobile drawer
- [x] Wallet sub-routes accessible on mobile
- [x] Smooth open/close animation
- [x] Overlay dismiss on tap
- [x] No horizontal scroll in drawer

---

## Target Benchmark Alignment

| Benchmark | Implementation |
|-----------|----------------|
| Revolut | Wide drawer, clear labels, scroll lock |
| Binance | Bottom tabs + full menu drawer |
| Coinbase | Active state indicators, safe-area padding |
