'use client'

import { Edit, Trash2, Plus } from 'lucide-react'

export default function RewardsManagement() {
  const tiers = [
    { name: 'Bronze', minPoints: 0, maxPoints: 999, benefits: 'Basic support, 1% cashback', members: 8420 },
    { name: 'Silver', minPoints: 1000, maxPoints: 4999, benefits: 'Priority support, 2% cashback, exclusive content', members: 12350 },
    { name: 'Gold', minPoints: 5000, maxPoints: 24999, benefits: 'VIP support, 3% cashback, monthly bonus', members: 2840 },
    { name: 'Platinum', minPoints: 25000, maxPoints: 99999, benefits: 'Concierge, 5% cashback, quarterly bonus', members: 420 },
    { name: 'Diamond', minPoints: 100000, maxPoints: 'Unlimited', benefits: 'Personal manager, 10% cashback, annual bonus', members: 50 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rewards Management</h2>
          <p className="text-muted-foreground mt-1">Manage reward tiers and benefits</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-5 w-5" />
          New Tier
        </button>
      </div>

      {/* Tiers Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Tier</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Points Range</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Benefits</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Members</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tiers.map((tier, idx) => (
              <tr key={idx} className="hover:bg-background transition-colors">
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">{tier.name}</span>
                </td>
                <td className="px-6 py-4 text-muted-foreground text-sm">{tier.minPoints.toLocaleString()} - {typeof tier.maxPoints === 'number' ? tier.maxPoints.toLocaleString() : tier.maxPoints}</td>
                <td className="px-6 py-4 text-sm text-foreground">{tier.benefits}</td>
                <td className="px-6 py-4 text-foreground font-medium">{tier.members.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-background rounded-lg transition-colors">
                      <Edit className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-background rounded-lg transition-colors">
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
