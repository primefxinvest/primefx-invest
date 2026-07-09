/**
 * Verifies lifetime profit computation logic (mirrors lib/invest/investment-metrics.ts).
 * Run: node scripts/verify-lifetime-profit-sync.mjs
 */

function calculateAccumulatedProfit(amount, currentValue) {
  return Math.max(0, Math.round((currentValue - amount) * 100) / 100)
}

function isActiveInvestmentStatus(status) {
  return String(status ?? '').toLowerCase() === 'active'
}

function computeLifetimeProfitUsd(investments) {
  return investments
    .filter((row) => isActiveInvestmentStatus(row.status))
    .reduce((sum, row) => sum + calculateAccumulatedProfit(row.amount, row.currentValue), 0)
}

function calculateDailyProfit(principalUsd, weeklyRoiPercent) {
  if (principalUsd <= 0 || weeklyRoiPercent <= 0) return 0
  return Math.round(principalUsd * (weeklyRoiPercent / 100 / 7) * 100) / 100
}

function calculateWeeklyEarnings(amount, weeklyRoiPercent) {
  if (amount <= 0 || weeklyRoiPercent <= 0) return 0
  return Math.round(amount * (weeklyRoiPercent / 100) * 100) / 100
}

const investment = {
  id: 'inv-1',
  amount: 500,
  currentValue: 502.5,
  weeklyRoiPercent: 3.5,
  status: 'Active',
}

assert(calculateAccumulatedProfit(500, 500) === 0, 'no credit yet => $0 lifetime')
assert(calculateAccumulatedProfit(500, 502.5) === 2.5, 'day 1 credit => $2.50')
assert(computeLifetimeProfitUsd([investment]) === 2.5, 'single position lifetime')

const day2 = { ...investment, currentValue: 505 }
assert(computeLifetimeProfitUsd([day2]) === 5, 'day 2 => $5.00')
assert(calculateDailyProfit(500, 3.5) === 2.5, 'daily rate $2.50')
assert(calculateWeeklyEarnings(500, 3.5) === 17.5, 'weekly rate $17.50')

console.log('All lifetime profit sync checks passed.')

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exit(1)
  }
}
