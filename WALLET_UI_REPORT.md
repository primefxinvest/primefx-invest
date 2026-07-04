# PrimeFx Invest — Wallet UI Report

**Date:** July 4, 2026

---

## Wallet Overview Layout

```
┌─────────────────────────────────────────────────────────┐
│  Page header + KYC banner                               │
├─────────────────────────────────────────────────────────┤
│  KPI ROW (4 cards)                                      │
│  Current Balance | Current Value | Total Invested | Profit │
├─────────────────────────────────────────────────────────┤
│  ACTION ROW (3 cards)                                   │
│  Deposit | Withdraw | Transfer                          │
├─────────────────────────────────────────────────────────┤
│  Donut | Health | PrimeAI                               │
├─────────────────────────────────────────────────────────┤
│  Transactions table                                     │
├─────────────────────────────────────────────────────────┤
│  Activity summary | Payment methods                     │
└─────────────────────────────────────────────────────────┘
```

---

## 1. KPI Row (`WalletBalanceCards.tsx`)

### Replaced
- Available Balance, Pending Balance, Bonus Balance, Total Balance

### New (unified with Dashboard)
| Card | Data source | Notes |
|------|-------------|-------|
| Current Balance | `wallet.availableBalance` | Links to `/wallet` |
| Current Value | `metrics.currentValue` | Trend from `metrics.trends[1]` |
| Total Invested | `metrics.totalInvested` | Trend from `metrics.trends[0]` |
| Total Profit | `metrics.totalProfit` | Trend from `metrics.trends[2]` |

### Component
- `InvestorKpiCards variant="wallet"`
- `KpiGrid count={4}`
- Realtime refresh via `useUserWalletRealtime`

### Responsive
| Breakpoint | Layout |
|------------|--------|
| Desktop (`lg+`) | 4 in one row |
| Tablet (`md`) | 2×2 |
| Mobile | 2×2 |

---

## 2. Action Cards (`WalletActionCards.tsx`)

### Layout
| Breakpoint | Columns |
|------------|---------|
| `< 480px` | 1 (stacked) |
| `≥ 480px` | 3 equal columns |

### Design
- Horizontal compact card: icon + title + description
- `statusCardSurfaceClass` — matches KPI card chrome
- `min-h-[4.5rem]` / `sm:min-h-[5rem]` — no oversized tiles
- Icon boxes: emerald (deposit), orange (withdraw), primary blue (transfer)

### Routes (unchanged)
- `/wallet/deposit`
- `/wallet/withdraw`
- `/wallet/transfer`

---

## 3. Preserved Features

- Balance donut chart (still shows available vs pending breakdown)
- Wallet health card
- PrimeAI insight
- Transaction table
- Activity summary + payment methods
- KYC financial banner

---

## Files Changed

| File | Change |
|------|--------|
| `components/wallet/WalletBalanceCards.tsx` | Investor KPIs |
| `components/wallet/WalletActionCards.tsx` | 3-column action row |
| `components/shared/kpi/InvestorKpiCards.tsx` | **New** shared KPI mapper |
| `app/[locale]/(dashboard)/wallet/page.tsx` | Settings button tokens |

---

## Benchmark Alignment

| Platform | Pattern matched |
|----------|-----------------|
| Binance | KPI strip + action row above details |
| Revolut | Compact horizontal action tiles |
| Coinbase | Equal-width action buttons |
