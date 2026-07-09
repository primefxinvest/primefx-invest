/** Shared async-cache keys — use across dashboard, wallet, portfolio. */
export const CACHE_KEYS = {
  portfolioMetrics: 'portfolio-metrics',
  portfolioOverview: 'portfolio-overview',
  walletData: 'wallet-data',
  assetAllocation: 'asset-allocation',
  dashboardCore: 'dashboard-core',
  marketOverview: 'market-overview',
  rewardsData: 'rewards-data',
  userNotifications: 'user-notifications',
  recentTransactions: (limit: number) => `recent-transactions-${limit}`,
} as const
