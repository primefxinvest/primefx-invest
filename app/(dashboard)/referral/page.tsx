'use client'

import { Copy, Users, DollarSign, TrendingUp, Mail, Share2 } from 'lucide-react'

export default function ReferralPage() {
  const referrals = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      status: 'Active',
      commissionEarned: 125.50,
      joinedDate: '2024-05-15',
      tradingVolume: '$45,000',
    },
    {
      id: '2',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      status: 'Active',
      commissionEarned: 89.25,
      joinedDate: '2024-04-22',
      tradingVolume: '$32,000',
    },
    {
      id: '3',
      name: 'Robert Wilson',
      email: 'robert.w@example.com',
      status: 'Active',
      commissionEarned: 156.75,
      joinedDate: '2024-03-10',
      tradingVolume: '$78,000',
    },
  ]

  const copyToClipboard = () => {
    navigator.clipboard.writeText('https://primeai.com/ref/user123456')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Referral Program</h1>
        <p className="mt-1 text-muted-foreground">Earn commissions by referring other investors to PrimeAI.</p>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Referrals</p>
          <p className="mt-2 text-3xl font-bold text-foreground">12</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Active Referrals</p>
          <p className="mt-2 text-3xl font-bold text-primary">3</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Earned</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">$371.50</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Commission Rate</p>
          <p className="mt-2 text-3xl font-bold text-foreground">15%</p>
        </div>
      </div>

      {/* Your Referral Link */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Your Referral Link</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value="https://primeai.com/ref/user123456"
            readOnly
            className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Share this link with your network to start earning commissions.</p>
      </div>

      {/* Sharing Options */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Share Your Link</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {[
            { name: 'Email', icon: Mail },
            { name: 'LinkedIn', icon: Share2 },
            { name: 'Twitter', icon: Share2 },
            { name: 'Facebook', icon: Share2 },
          ].map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.name}
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 hover:bg-secondary transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span className="font-semibold text-foreground">{option.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Referrals */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Active Referrals</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Trading Volume</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-muted-foreground">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {referrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-secondary transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-foreground">{referral.name}</td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{referral.email}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className="inline-block rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-foreground">{referral.tradingVolume}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-primary">${referral.commissionEarned}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commission Structure */}
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Commission Structure</h2>
        <div className="space-y-3">
          {[
            { tier: 'Tier 1', referrals: 'First 5 referrals', rate: '10%', description: 'Get started with the referral program' },
            { tier: 'Tier 2', referrals: '5-15 referrals', rate: '15%', description: 'Earning more with increased commissions' },
            { tier: 'Tier 3', referrals: '15+ referrals', rate: '20%', description: 'Top tier commission rate' },
          ].map((tier, idx) => (
            <div key={idx} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{tier.tier}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tier.referrals}</p>
                  <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
                </div>
                <span className="text-lg font-bold text-primary">{tier.rate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
