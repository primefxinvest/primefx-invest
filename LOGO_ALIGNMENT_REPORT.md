# Logo Alignment Report

**Date:** July 5, 2026  
**Scope:** Global PrimeFx logo rendering and alignment  
**Constraints:** No brand color or route changes

---

## Problem Statement

Logo mark and wordmark needed sharper retina rendering, consistent vertical alignment, and uniform spacing across sidebar, auth, and marketing surfaces.

---

## Solution: `components/shared/Logo.tsx`

### Retina rendering

The logo image now renders at **2× intrinsic resolution** and displays at the canonical size via inline dimensions:

```tsx
const retinaSize = markSize * 2

<Image
  width={retinaSize}
  height={retinaSize}
  sizes={`${markSize}px`}
  style={{ width: markSize, height: markSize, maxWidth: markSize, maxHeight: markSize }}
  quality={100}
  draggable={false}
/>
```

This ensures crisp display on Retina/HiDPI screens without stretching or compression.

### Typography

- Responsive text scale keyed to mark size (`textScaleForMark`)
- `antialiased` on brand and tagline spans
- `flex-col justify-center gap-0.5` for vertical centering of wordmark block
- Gap between icon and text: `gap-2.5` (< 40px mark) or `gap-3` (≥ 40px mark)

### Size tokens (`lib/layout/logo.ts`)

| Token | Size | Usage |
|-------|------|-------|
| `sidebarIcon` | 32px | Tablet icon rail |
| `sidebarFull` | 36px | Desktop sidebar wordmark |
| `mobileDrawer` | 36px | Mobile drawer wordmark |
| `marketing` | 36px | Landing nav/footer |
| `navbar` | 32px | Dashboard top bar |
| `authForm` | 40px | Auth mobile hero |
| `authHero` | 44px | Auth desktop hero panel |
| `authCompact` | 48px | MFA / compact auth |

---

## Layout: Icon + Text Hierarchy

```
[Logo Icon]  PrimeFx
             INVEST
```

- Icon and text block aligned on `items-center` flex row
- Wordmark block vertically centered relative to icon
- `truncate` on brand line prevents overflow in narrow sidebars
- Tagline uses uppercase with letter-spacing scaled to mark size

---

## Surface Audit

| Surface | Component | Config | Alignment |
|---------|-----------|--------|-----------|
| Desktop sidebar | `Sidebar.tsx` | `sidebarFull`, `showText` | Left-aligned in 3.75rem header |
| Mobile drawer | `Sidebar.tsx` | `mobileDrawer`, `showText` | Full wordmark, `md:hidden` |
| Tablet rail | `Sidebar.tsx` | `sidebarIcon`, `showText={false}` | Icon only (md–lg breakpoint) |
| Auth hero (desktop) | `AuthHeroPanel` | `authHero`, `onDark`, `priority` | Top of dark panel |
| Auth hero (mobile) | `AuthMobileHero` | `authForm`, `onDark`, `priority` | Centered in mobile hero |
| Landing nav | `LandingNav` | `marketing`, `priority` | Nav left |
| Landing footer | `LandingFooter` | `marketing` | Footer brand block |
| Admin shell | `AdminShell` | `sidebarFull`, tagline="ADMIN" | Admin sidebar |

---

## Sidebar Header Spec

```
Height:     h-[3.75rem] (60px)
Padding:    px-4
Border:     border-b border-gray-200
Alignment:  items-center justify-between
```

Three responsive Logo instances share one header row — only one visible per breakpoint.

---

## Quality Checklist

- [x] No blurry logo on Retina displays (2× source scaling)
- [x] No stretched or compressed mark (`object-contain` + fixed dimensions)
- [x] Icon and text vertically centered
- [x] Consistent PrimeFx / INVEST hierarchy
- [x] `priority` on above-the-fold logos (sidebar, auth)
- [x] Dark variant (`onDark`) for auth hero panels only

---

## Recommendations (Future, Optional)

- Replace `/logo.png` with an SVG or WebP @2x asset for even sharper scaling at large sizes
- Add `prefers-reduced-motion` consideration if logo animations are introduced later
