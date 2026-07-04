# PrimeFx Invest — Referral UI Report

**Date:** July 4, 2026  
**Scope:** Information hierarchy only — no referral calculation or logic changes

---

## Hierarchy Improvements

### 1. Link sharing (mobile-first)
- **Before:** `ReferralLinkCenter` only in desktop sticky sidebar (below fold on mobile)
- **After:** Compact link center rendered **above main content on `< xl`**, full sidebar version on desktop
- QR hidden in compact mode; share actions in horizontal scroll row with 44px targets

### 2. Leaderboard clarity
- **Renamed:** "Top referrers" → **"Top earning referrals"**
- **Subtitle:** "Commissions from your network"
- **CTA:** Disabled "Coming Soon" replaced with anchor to `#all-referrals`

### 3. Design token alignment
- `ReferralLinkCenter` uses `cardSurfaceClass`, `border-border`, `text-foreground`
- Leaderboard panel uses semantic card surfaces
- Copy/share buttons use `min-h-11` touch targets

---

## Preserved Sections

- Hero + lifetime/month metrics
- Commission explainer
- Stats grid (`KpiCard` system)
- Rank progression panel
- Earnings analytics charts
- Network tree visualization
- Achievements badges
- All referrals table + funnel
- PrimeAI insights
- Transparency section
- All rank levels table

---

## Mobile Layout

| Element | Behavior |
|---------|----------|
| Link center | Top placement (compact) |
| Share buttons | Horizontal scroll, no orphan grid cell |
| Stats grid | 2-column responsive (existing `KpiCard`) |
| Leaderboard | Full width in sidebar column on desktop; follows main flow on mobile |

---

## Benchmark Alignment

| Platform | Pattern |
|----------|---------|
| Binance Referral | Prominent copy-link + share row |
| Bybit Referral | Earnings KPIs + network stats |
| Coinbase Referral | Clear commission context labels |

---

## Files Changed

- `components/referral/ReferralProgramView.tsx`
- `components/referral/ReferralLinkCenter.tsx`
