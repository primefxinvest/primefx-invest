'use client'

import { CheckCircle2, AlertCircle, FileText, Lock } from 'lucide-react'

export default function ComplianceCenter() {
  const complianceItems = [
    { title: 'GDPR Compliance', status: 'Compliant', description: 'User data protection and privacy', icon: Lock },
    { title: 'AML Policy', status: 'Active', description: 'Anti-Money Laundering controls', icon: AlertCircle },
    { title: 'KYC Requirements', status: 'Enforced', description: 'Know Your Customer verification', icon: FileText },
    { title: 'Risk Assessment', status: 'Updated', description: 'Latest regulatory risk assessment', icon: CheckCircle2 },
  ]

  const auditLogs = [
    { action: 'Large Deposit', user: 'John Doe', amount: '$50,000', status: 'Flagged', date: '2024-06-25' },
    { action: 'KYC Update', user: 'Jane Smith', status: 'Approved', date: '2024-06-24' },
    { action: 'Account Suspension', user: 'Mike Johnson', reason: 'Suspicious Activity', date: '2024-06-23' },
    { action: 'Withdrawal Limit', user: 'Sarah Williams', amount: '$10,000/day', date: '2024-06-22' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Compliance Center</h2>
        <p className="text-muted-foreground mt-1">Regulatory compliance and risk management</p>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {complianceItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <Icon className="h-8 w-8 text-primary" />
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  item.status === 'Compliant' || item.status === 'Active' || item.status === 'Enforced' || item.status === 'Updated'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-orange-500/10 text-orange-500'
                }`}>
                  {item.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </div>
          )
        })}
      </div>

      {/* Audit Logs */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Recent Audit Events</h3>
        <div className="space-y-3">
          {auditLogs.map((log, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-foreground">{log.action}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {'amount' in log ? `${log.user} - ${log.amount}` : 
                   'reason' in log ? `${log.user} - ${log.reason}` :
                   log.user}
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium mb-2 block ${
                  log.status === 'Approved' || log.status === 'Updated'
                    ? 'bg-accent/10 text-accent'
                    : log.status === 'Flagged'
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-foreground/10 text-foreground'
                }`}>
                  {log.status || 'Recorded'}
                </span>
                <p className="text-xs text-muted-foreground">{log.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
