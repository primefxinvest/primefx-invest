# PrimeFx Invest — Rewards UI Report

**Date:** July 4, 2026  
**Scope:** Layout and hierarchy — no rewards calculation changes

---

## Summary

Rewards page refactored from a monolithic inline component into a structured, gamified layout aligned with the platform KPI system.

---

## Improvements

### 1. Summary KPI row (`RewardsSummaryKpis`)
Four unified `KpiCard` metrics:
- Total Points
- Achievements Earned (with in-progress caption)
- Current Tier
- Tier Progress %

### 2. Dedicated tier progress strip
Full-width progress bar below KPIs — **"Path to next tier"** — replaces dense nested progress inside a single summary card.

### 3. Achievement cards (`AchievementCard`)
- Extracted to `components/rewards/AchievementCard.tsx`
- Uses `cardSurfaceClass` consistently
- Thicker progress bars (`h-2.5`) with transition animation
- Earned badge with primary styling

### 4. Tier benefits
- Bullet list with trophy icons (replaces `join(' · ')` string)
- Current tier highlighted with `border-primary/30 bg-primary/5`

### 5. Caching
- `fetchRewardsData` uses shared `CACHE_KEYS.rewardsData` (dashboard secondary can dedupe)

---

## Layout Structure

```
Header
├── RewardsSummaryKpis (4 KPI + progress strip)
├── Achievements (Earned grid → In progress grid)
└── Tier benefits (list with bullets)
```

---

## Mobile

- KPI grid: 2×2 on mobile, 4-up on desktop
- Achievement cards: 1 → 2 → 3 column responsive grid
- Touch-friendly card padding via `cardSurfaceClass`

---

## Files

| File | Role |
|------|------|
| `app/[locale]/(dashboard)/rewards/page.tsx` | Page orchestration |
| `components/rewards/RewardsSummaryKpis.tsx` | KPI summary |
| `components/rewards/AchievementCard.tsx` | Achievement tile |
