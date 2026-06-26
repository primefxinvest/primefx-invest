'use client'

import { Calendar, Download, TrendingUp, AlertCircle } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import { PortfolioChart, AssetAllocationChart } from '@/components/shared/Charts'
import { portfolioData, chartData, assetAllocation, activeInvestments, completedInvestments } from '@/lib/mock-data'

export default function PortfolioPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Portfolio Overview</h1>
          <p className="mt-1 text-muted-foreground">Track your investments, performance, and growth in real-time.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <Download className="h-4 w-4" />
          Download Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Total Invested"
          value={portfolioData.totalInvested}
          trend="Across 6 active plans"
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Current Value"
          value={portfolioData.currentValue}
          trend="Updated in real-time"
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Profit / Loss"
          value={portfolioData.totalProfit}
          trend="Total Profit"
          trendColor="green"
        />
        <MetricCard
          icon={<AlertCircle className="h-6 w-6" />}
          label="ROI %"
          value={portfolioData.roiPercentage}
          trend="Overall Return"
          trendColor="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Portfolio Performance</h2>
            <div className="flex gap-2">
              {['1M', '6M', '1Y', '3Y', 'All'].map((period) => (
                <button key={period} className={`rounded px-3 py-1 text-sm font-semibold transition-colors ${period === '1Y' ? 'bg-primary text-white' : 'hover:bg-secondary text-foreground'}`}>
                  {period}
                </button>
              ))}
            </div>
          </div>
          <PortfolioChart data={chartData} />
        </div>

        {/* Asset Allocation */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Asset Allocation</h2>
          <AssetAllocationChart data={assetAllocation} />
          <div className="mt-6 space-y-3">
            {assetAllocation.map((asset) => (
              <div key={asset.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asset.color }} />
                  <span className="text-muted-foreground">{asset.name}</span>
                </div>
                <span className="font-semibold text-foreground">{asset.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Investments */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Active Investments</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm">
                <th className="pb-3 text-left font-semibold text-foreground">Plan</th>
                <th className="pb-3 text-left font-semibold text-foreground">Invested</th>
                <th className="pb-3 text-left font-semibold text-foreground">Current Value</th>
                <th className="pb-3 text-left font-semibold text-foreground">ROI %</th>
                <th className="pb-3 text-left font-semibold text-foreground">Status</th>
                <th className="pb-3 text-left font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeInvestments.map((investment) => (
                <tr key={investment.id} className="border-b border-border py-4 text-sm hover:bg-secondary transition-colors">
                  <td className="py-4 text-foreground">{investment.plan}</td>
                  <td className="py-4 text-foreground">{investment.invested}</td>
                  <td className="py-4 text-foreground">{investment.currentValue}</td>
                  <td className="py-4 text-emerald-500 font-semibold">{investment.roi}</td>
                  <td className="py-4">
                    <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {investment.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <button className="text-primary hover:text-blue-700 font-semibold">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Completed Investments */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Completed Investments</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-sm">
                <th className="pb-3 text-left font-semibold text-foreground">Plan</th>
                <th className="pb-3 text-left font-semibold text-foreground">Invested</th>
                <th className="pb-3 text-left font-semibold text-foreground">Final Value</th>
                <th className="pb-3 text-left font-semibold text-foreground">Profit</th>
                <th className="pb-3 text-left font-semibold text-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {completedInvestments.map((investment) => (
                <tr key={investment.id} className="border-b border-border py-4 text-sm hover:bg-secondary transition-colors">
                  <td className="py-4 text-foreground">{investment.plan}</td>
                  <td className="py-4 text-foreground">{investment.invested}</td>
                  <td className="py-4 text-foreground">{investment.finalValue}</td>
                  <td className={`py-4 font-semibold ${investment.profit.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{investment.profit}</td>
                  <td className="py-4 text-foreground">{investment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
