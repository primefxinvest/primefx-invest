# PrimeFx Invest — Logo System Report

**Date:** July 4, 2026

---

## Canonical Sizes (`lib/layout/logo.ts`)

| Key | Pixels | Usage |
|-----|--------|-------|
| `sidebarIcon` | 32 | Tablet icon rail |
| `sidebarFull` | 32 | Desktop sidebar wordmark |
| `mobileDrawer` | 32 | Mobile drawer header |
| `marketing` | 36 | Landing nav + footer |
| `navbar` | 32 | Dashboard navbar (reserved) |
| `authForm` | 40 | Auth mobile hero |
| `authHero` | 44 | Auth desktop hero |
| `authCompact` | 48 | MFA verify |

---

## Component API (`components/shared/Logo.tsx`)

```tsx
<Logo
  href="/dashboard"
  sizeKey="sidebarFull"   // or size={32}
  showText
  tagline="INVEST"
  variant="default" | "onDark"
  priority
/>
```

### Rendering Fixes
- Explicit `style={{ width, height }}` prevents layout stretch
- `sizes` attribute matches display size for responsive loading
- `quality={100}` for crisp PNG on retina
- `object-contain` on image
- Typography scales with mark size (`textScaleForMark`)
- `variant="onDark"` for auth hero (white / `#60a5fa` tagline) without ad-hoc class overrides

---

## Audit Results

| Location | Before | After |
|----------|--------|-------|
| Sidebar | `size={34}` | `sizeKey="sidebarIcon"` / `sidebarFull` |
| Landing nav/footer | `size={36}` | `sizeKey="marketing"` |
| Auth hero desktop | `size={44}` + manual classes | `sizeKey="authHero" variant="onDark"` |
| Auth hero mobile | `size={40}` + manual classes | `sizeKey="authForm" variant="onDark"` |
| MFA verify | `size={64}` (oversized) | `sizeKey="authCompact"` |
| Admin shell | `size={40}` | `sizeKey="sidebarFull"` |

---

## Proportions

- Mark-to-text gap: `gap-2.5` (≤36px), `gap-3` (≥40px)
- Wordmark: **PrimeFx** bold + **INVEST** tracking-widest in `#0052ff`
- Icon-only mode: `showText={false}` for tablet rail

---

## Retina / Scaling

- Next.js `Image` with matching `width`/`height` props
- No CSS scale transforms on logo asset
- `priority` on above-the-fold placements (sidebar, auth, landing)

---

## Remaining Asset Note

Logo source: `/logo.png`. For maximum sharpness at all DPRs, consider adding `@2x` SVG or PNG in a future asset pass (out of scope for this UI-only change).
