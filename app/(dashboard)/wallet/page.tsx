'use client'

import { Download, Upload, Send, DollarSign, Shield, Lock, Settings } from 'lucide-react'
import MetricCard from '@/components/shared/MetricCard'
import { AssetAllocationChart } from '@/components/shared/Charts'
import { walletData, recentTransactions } from '@/lib/mock-data'

export default function WalletPage() {
  const balanceData = [
    { name: 'Available', value: 81.3, color: '#10b981' },
    { name: 'Pending', value: 14.9, color: '#f97316' },
    { name: 'Bonus', value: 3.8, color: '#8b5cf6' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
          <p className="mt-1 text-muted-foreground">Manage your funds, track balances, and perform secure transactions.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-semibold text-white hover:bg-blue-700 transition-colors">
          <Settings className="h-4 w-4" />
          Wallet Settings
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{walletData.availableBalance}</p>
          <p className="mt-2 text-xs text-emerald-500">Available to use</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending Balance</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{walletData.pendingBalance}</p>
          <p className="mt-2 text-xs text-orange-500">In processing</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Bonus Balance</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{walletData.bonusBalance}</p>
          <p className="mt-2 text-xs text-purple-500">Bonus earnings</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Balance</p>
          <p className="mt-3 text-3xl font-bold text-foreground">{walletData.totalBalance}</p>
          <p className="mt-2 text-xs text-foreground">Total funds</p>
        </div>
      </div>

      {/* Wallet Actions */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">Wallet Actions</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            { icon: Download, label: 'Deposit', color: 'bg-emerald-500' },
            { icon: Upload, label: 'Withdraw', color: 'bg-orange-500' },
            { icon: Send, label: 'Transfer', color: 'bg-blue-500' },
            { icon: DollarSign, label: 'Convert', color: 'bg-purple-500' },
            { icon: Lock, label: 'Payment', color: 'bg-red-500' },
          ].map((action, idx) => (
            <button
              key={idx}
              className="flex flex-col items-center gap-3 rounded-lg p-4 hover:bg-secondary transition-colors"
            >
              <div className={`${action.color} rounded-lg p-3 text-white`}>
                <action.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Balance Overview & Wallet Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Balance Overview */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Balance Overview</h2>
            <select className="rounded-lg border border-border bg-background px-3 py-1 text-sm outline-none">
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
          <AssetAllocationChart data={balanceData} />
          <div className="mt-6 space-y-3">
            {walletData.balanceBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: balanceData[idx].color }} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <span className="font-semibold text-foreground">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Health & PrimeAI */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet Health */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-6">Wallet Health</h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-emerald-500" />
                  <p className="text-lg font-semibold text-emerald-500">Secure & Protected</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Your wallet is secure with 256-bit encryption</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-500">81.3%</p>
                <p className="text-xs text-muted-foreground mt-1">Health Score</p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-secondary">
              <div className="h-2 rounded-full bg-emerald-500 w-4/5" />
            </div>
          </div>

          {/* PrimeAI Insight */}
          <div className="rounded-lg border border-primary bg-blue-50 dark:bg-blue-950 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold flex-shrink-0">
                P
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">PrimeAI Wallet Insight</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your wallet is well managed! Based on your spending patterns, you can optimize your available balance to earn more returns.
                </p>
                <button className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                  Ask PrimeAI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary text-white px-3 py-1 text-sm font-semibold">All</button>
            {['Deposit', 'Withdrawal', 'Transfer', 'Bonus'].map((type) => (
              <button
                key={type}
                className="rounded-lg border border-border px-3 py-1 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                {type}
              </button>
            ))}
            <button className="ml-auto rounded-lg border border-border px-3 py-1 text-sm font-semibold hover:bg-secondary transition-colors">
              Filter
            </button>
            <button className="rounded-lg border border-border px-3 py-1 text-sm font-semibold hover:bg-secondary transition-colors">
              Export
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-secondary transition-colors">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-2 ${tx.type === 'Deposit' ? 'bg-emerald-100 dark:bg-emerald-950' : tx.type === 'Withdraw' ? 'bg-red-100 dark:bg-red-950' : 'bg-blue-100 dark:bg-blue-950'}`}>
                  {tx.type === 'Deposit' && <Download className="h-5 w-5 text-emerald-600" />}
                  {tx.type === 'Withdraw' && <Upload className="h-5 w-5 text-red-600" />}
                  {tx.type === 'Profit' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                  {tx.type === 'Bonus' && <Gift className="h-5 w-5 text-purple-600" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{tx.amount}</p>
                <p className="text-xs text-muted-foreground">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

import { Gift } from 'lucide-react'
