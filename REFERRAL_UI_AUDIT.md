# Referral UI Audit — PrimeFx Invest

**Date:** July 5, 2026  
**Reference:** Attached Referral Center screenshot (source of truth)  
**Status:** Redesigned (UI/IA only)

---

## Executive Summary

The Referral Center has been restructured to match the reference design: hero with illustration and CTAs, four KPI cards, rank progression, three “How you earn” cards, four-level network timeline, earnings calculator, and trust footer — while preserving all existing analytics, referral tables, charts, and backend commission logic.

---

## Layout vs Reference

| Reference Section | Implementation |
|-------------------|----------------|
| Hero badges + headline + CTAs | `ReferralHeroSection` |
| Right illustration | `ReferralHeroIllustration` (SVG network) |
| 4 KPI cards | `ReferralStatsGrid` (Lifetime, Month, Referrals, Active) |
| Rank progression | `ReferralRankProgressCard` |
| How you earn (3 cards) | `ReferralCommissionSection` |
| 4-level network timeline | `ReferralNetworkTimeline` |
| Earnings calculator | `ReferralEarningsCalculator` |
| Trust cards (4) | `ReferralTrustSection` |

**Retained below fold (features not removed):**

- Referral link center (sidebar + mobile)
- Earnings analytics chart
- Network tree panel
- All referrals table
- Conversion funnel
- Achievements & challenges
- PrimeAI insights
- Rank levels table
- Leaderboard sidebar

---

## Information Architecture (Page Order)

1. Hero + Share / How it works  
2. KPI row (4 metrics)  
3. Rank progression card  
4. How you earn  
5. 4-level network timeline  
6. Earnings calculator  
7. Trust section  
8. Link center (mobile)  
9. Main dashboard (charts, network, referrals)  
10. PrimeAI insights  
11. All rank levels  

---

## Display vs Backend Rates

UI copy uses `lib/referral/display-config.ts` (1.5%, 3%/1%/0.5%/0.25%) for transparency cards and calculator. Backend calculations remain in `lib/referral/program-config.ts` — **unchanged**.

---

## New / Updated Files

| File | Role |
|------|------|
| `ReferralHeroSection.tsx` | Hero with gradient headline, CTAs, illustration |
| `ReferralHeroIllustration.tsx` | Network SVG illustration |
| `ReferralStatsGrid.tsx` | 4 KPI cards |
| `ReferralRankProgressCard.tsx` | Rank + progress + next reward |
| `ReferralNetworkTimeline.tsx` | L1–L4 premium timeline |
| `ReferralEarningsCalculator.tsx` | Interactive slider calculator |
| `ReferralTrustSection.tsx` | 4 trust cards |
| `display-config.ts` | Network levels + trust copy + examples |

---

## Responsive Grid

| Section | Desktop | Tablet | Mobile |
|---------|---------|--------|--------|
| KPI row | 4 col | 2×2 | 2 col |
| How you earn | 3 col | stack | stack |
| Trust cards | 4 col | 2 col | 1 col |
| Hero | 2 col | stack | stack |

---

## Constraints Verified

- [x] Route `/referral` unchanged  
- [x] No commission calculation changes  
- [x] No backend logic changes  
- [x] PrimeFx `#0052ff` preserved  
- [x] All existing features retained  
