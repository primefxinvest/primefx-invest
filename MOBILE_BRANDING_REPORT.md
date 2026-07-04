# Mobile Branding Report

**Date:** July 5, 2026  
**Scope:** Mobile sidebar and auth mobile branding  
**Constraints:** No route, color, or logic changes

---

## Requirement

On mobile, always display full PrimeFx INVEST branding — never icon-only:

```
[Logo Icon]  PrimeFx
             INVEST
```

Same proportions, spacing, and typography hierarchy as desktop.

---

## Mobile Sidebar (`components/shared/Sidebar.tsx`)

### Breakpoint strategy

| Breakpoint | Logo variant | Display |
|------------|--------------|---------|
| `< md` (mobile) | `mobileDrawer` + `showText` | **Full wordmark** |
| `md – lg` (tablet) | `sidebarIcon` + `showText={false}` | Icon rail only |
| `≥ lg` (desktop) | `sidebarFull` + `showText` | Full wordmark |

### Mobile drawer implementation

```tsx
<Logo
  href="/dashboard"
  sizeKey="mobileDrawer"
  showText
  className="min-w-0 flex-1 md:hidden"
  priority
/>
```

- Visible only below `md` breakpoint
- Uses 36px mark (same as desktop sidebar full)
- `flex-1 min-w-0` allows truncation in tight layouts without breaking alignment
- Header row: `h-[3.75rem] items-center px-4` — vertically centers logo block

---

## Mobile Auth Branding

### `AuthMobileHero` (login + signup)

Shown on `lg:hidden` — replaces desktop left hero on phones/tablets:

- Centered full wordmark: `Logo showText sizeKey="authForm" variant="onDark" priority`
- 40px mark with responsive text scale
- Dark hero background matches desktop panel (`#0a1628`)
- Title + subtitle below logo

### Signup form (mobile)

- White card from `AuthFormShell` stacks below mobile hero
- No onboarding stepper — clean single-form experience
- Same padding as desktop: `p-6 sm:p-8`

---

## Typography Hierarchy (Mobile = Desktop)

| Element | Mobile | Desktop |
|---------|--------|---------|
| Brand line | `PrimeFx` bold, antialiased | Same |
| Tagline | `INVEST` uppercase, `#0052ff` / `#60a5fa` on dark | Same |
| Mark size (drawer) | 36px | 36px |
| Mark size (auth hero) | 40px | 44px (desktop panel) |
| Icon–text gap | 2.5–3 (size-dependent) | Same |

Minor auth hero mark size difference (40 vs 44) is intentional — mobile hero is more compact while preserving proportions.

---

## Vertical Alignment

Logo component structure ensures consistent centering:

```
inline-flex items-center [gap]
  ├── Image (shrink-0, fixed markSize)
  └── flex-col justify-center gap-0.5
        ├── PrimeFx
        └── INVEST
```

The wordmark column is vertically centered against the icon using flexbox — no manual padding hacks.

---

## Pages Verified

| Page | Mobile branding |
|------|-----------------|
| Dashboard | Full wordmark in drawer |
| Invest | Full wordmark in drawer |
| Portfolio | Full wordmark in drawer |
| Wallet | Full wordmark in drawer |
| Referral | Full wordmark in drawer |
| Rewards | Full wordmark in drawer |
| Community | Full wordmark in drawer |
| Market Insights | Full wordmark in drawer |
| Support | Full wordmark in drawer |
| Login | AuthMobileHero full wordmark |
| Signup | AuthMobileHero full wordmark |

---

## Compliance Checklist

- [x] Mobile drawer shows icon + PrimeFx + INVEST (not icon-only)
- [x] Same proportions as desktop sidebar wordmark
- [x] Vertically centered in drawer header
- [x] Auth pages show full branding on mobile
- [x] No new renders or state for branding
- [x] Retina-quality logo via 2× image scaling

---

## Note on Tablet Breakpoint

The `md–lg` tablet rail intentionally shows icon-only to preserve horizontal space in the collapsed sidebar. This matches the existing PrimeFx layout system and was not changed per scope (mobile drawer specifically required full branding).
