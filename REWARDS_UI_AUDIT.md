# Rewards UI Audit — PrimeFx Invest

**Date:** July 5, 2026  
**Scope:** `/rewards` page complete redesign  
**Status:** Implemented (UI only)

---

## Executive Summary

The Rewards page has been rebuilt as a gamified fintech experience with eight investor-focused sections, premium badge grid, progress visualization, and lifetime stats — using existing `fetchRewardsData`, `fetchRewardAchievements`, `fetchRewardTiers`, and `fetchRewardCatalogItems` APIs.

---

## Section Inventory

| # | Section | Data Source |
|---|---------|-------------|
| 1 | Current Rank | `fetchRewardsData()` |
| 2 | Reward Progress | `rewards.progress`, `rewards.points` |
| 3 | Upcoming Rewards | Badge tier grid (UI) + tier progress |
| 4 | Achievement Badges | `fetchRewardAchievements()` |
| 5 | Referral Milestones | Achievements filtered by referral |
| 6 | VIP Status Benefits | `fetchRewardTiers()` |
| 7 | Lifetime Achievements | Aggregated stats + catalog count |
| 8 | Leaderboard Position | Derived from tier progress + XP (UI estimate) |

---

## Badge Gamification

Six badge tiers displayed with unlock states:

- Bronze, Silver, Gold, Platinum, Diamond, Elite Investor

States: **Unlocked** · **In progress** (shows %) · **Locked**

Unlock logic compares current tier against badge order and earned achievements — display only, no backend mutation.

---

## Design Tokens

- `dashboardCardClass` / `cardSurfaceClass` for cards  
- `KpiGrid`-style 2/3/6 column badge grid  
- Gradient rank hero (`from-primary/5`)  
- Progress bars: primary → violet gradient  
- 44px min touch on interactive elements  

---

## Files

| File | Action |
|------|--------|
| `components/rewards/RewardsPageView.tsx` | Added — full page layout |
| `app/[locale]/(dashboard)/rewards/page.tsx` | Simplified to use view component |
| `components/rewards/AchievementCard.tsx` | Reused unchanged |
| `components/rewards/RewardsSummaryKpis.tsx` | Superseded by inline sections (retained in codebase) |

---

## Reference Quality

| Platform | Pattern |
|----------|---------|
| Coinbase Rewards | Badge grid + progress |
| Revolut Rewards | Tier benefits cards |
| Binance VIP | Rank hero + XP display |

---

## Constraints

- [x] No route changes  
- [x] No rewards calculation changes  
- [x] No feature removal  
- [x] PrimeFx colors unchanged  
