'use client'

import { Edit, Trash2, Plus } from 'lucide-react'

export default function PlansManagement() {
  const plans = [
    { id: 1, name: 'Starter Plan', roi: '8-15%', min: '$50', risk: 'Low', investors: '1,245' },
    { id: 2, name: 'Growth Plan', roi: '15-25%', min: '$500', risk: 'Medium', investors: '2,341' },
    { id: 3, name: 'Prime Plan', roi: '25-40%', min: '$2,000', risk: 'High', investors: '4,789' },
    { id: 4, name: 'Elite Plan', roi: '40-60%', min: '$10,000', risk: 'Very High', investors: '1,026' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Investment Plans</h2>
          <p className="text-muted-foreground mt-1">Manage investment plan offerings</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="h-5 w-5" />
          New Plan
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">Monthly ROI</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-background rounded-lg transition-colors">
                  <Edit className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-background rounded-lg transition-colors">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">ROI Range</span>
                <span className="font-semibold text-foreground">{plan.roi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Minimum</span>
                <span className="font-semibold text-foreground">{plan.min}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={`font-semibold ${
                  plan.risk === 'Low' ? 'text-accent' :
                  plan.risk === 'Medium' ? 'text-orange-500' :
                  'text-red-500'
                }`}>{plan.risk}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Investors</span>
                <span className="font-semibold text-foreground">{plan.investors}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
