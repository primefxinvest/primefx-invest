# PrimeFx Invest — Responsiveness Report (Final)

**Date:** July 4, 2026

---

## Breakpoints

| Token | Width | Usage |
|-------|-------|-------|
| default | < 640px | Mobile |
| `sm` | ≥ 640px | Large phone |
| `md` | ≥ 768px | Tablet |
| `lg` | ≥ 1024px | Desktop |
| `xl` | ≥ 1280px | Referral sidebar split |

---

## Dashboard

| Section | Mobile | Desktop |
|---------|--------|---------|
| KPIs (5) | 2×2 + ROI full width | 1×5 row |
| Charts | Stacked | 2/3 + 1/3 |
| Plans + transactions | Stacked | 2/3 width |
| Market widget | Below fold | Sidebar column |

---

## Wallet

| Section | Mobile | Desktop |
|---------|--------|---------|
| KPIs (4) | 2×2 | 1×4 |
| Actions | Stacked → 3-col at 480px+ | 1×3 row |

---

## Referral

| Section | Mobile | Desktop |
|---------|--------|---------|
| Link center | Top (compact) | Sticky sidebar |
| Stats | 2-col grid | Multi-col + health gauge |
| Share buttons | Horizontal scroll | Same |

---

## Rewards

| Section | Mobile | Desktop |
|---------|--------|---------|
| Summary KPIs | 2×2 | 1×4 |
| Achievements | 1 col | 3 col |
| Tier benefits | Stacked list | Stacked list |

---

## Navigation

| Mode | Behavior |
|------|----------|
| Mobile drawer | 18rem, labels visible, wallet submenu |
| Tablet rail | 4.5rem icons only |
| Desktop sidebar | Full labels + wallet expand |
| Bottom nav | 5 tabs, 64px height, safe-area |

---

## Overflow Prevention

- `min-w-0` on grids and flex children
- `truncate` / `line-clamp` on KPI labels
- `100dvh` sidebar height
- Body scroll lock when drawer open
- Chart containers: `overflow-hidden`

---

## QA Matrix

| Route | Mobile | Tablet | Desktop |
|-------|--------|--------|---------|
| `/dashboard` | ✅ | ✅ | ✅ |
| `/wallet` | ✅ | ✅ | ✅ |
| `/referral` | ✅ Link above fold | ✅ | ✅ Sidebar |
| `/rewards` | ✅ | ✅ | ✅ |
| Auth | ✅ Compact hero | ✅ Split | ✅ Split |

---

## Build

`npm run build` — **passed** (exit 0).
