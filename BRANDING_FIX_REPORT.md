# Branding Fix Report — PrimeFx Sidebar Logo

**Date:** July 5, 2026  
**Reference:** Attached sidebar branding screenshot  
**Status:** Fixed

---

## Problem

- Icon and wordmark appeared misaligned vertically  
- Text felt small relative to mark at 32px  
- INVEST tagline tracking inconsistent with reference  
- Mobile drawer did not match desktop proportions  

---

## Solution

### Logo component (`components/shared/Logo.tsx`)

- Text column uses `flex flex-col justify-center gap-0.5 leading-none` for vertical centering with mark  
- Mark and text aligned with `items-center` on flex row  
- Tagline: uppercase, semibold, `#0052ff`, letter-spacing scaled by mark size  
- Brand line: bold `text-gray-900`, `tracking-tight`  
- Retina: `quality={100}`, explicit width/height, `sizes` attribute  

### Size tokens (`lib/layout/logo.ts`)

| Token | Before | After |
|-------|--------|-------|
| `sidebarFull` | 32px | **36px** |
| `mobileDrawer` | 32px | **36px** |
| `sidebarIcon` | 32px | 32px (tablet rail unchanged) |

### Sidebar header (`components/shared/Sidebar.tsx`)

- Fixed height `h-[3.75rem]` on all breakpoints  
- Mobile: full wordmark visible (`showText`, not icon-only)  
- Desktop: identical composition to mobile  
- Close button: compact 36×36, right-aligned  

---

## Composition (All Mobile + Desktop Wordmark Views)

```
[Logo 36px]  PrimeFx
             INVEST
```

---

## Unchanged

- Logo asset: `/logo.png`  
- Primary blue: `#0052ff`  
- onDark variant for auth hero  
- No route or color token changes  

---

## QA Checklist

- [x] PrimeFx on line 1, INVEST on line 2  
- [x] Icon left-aligned, text vertically centered  
- [x] Mobile drawer shows full wordmark  
- [x] Desktop sidebar matches mobile composition  
- [x] Tablet icon rail unchanged  
- [x] High-DPI rendering enabled  
