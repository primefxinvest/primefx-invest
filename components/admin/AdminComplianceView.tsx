'use client'

import { CheckCircle2, AlertCircle, FileText, Lock } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { AdminAuditLogRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'

const COMPLIANCE_ITEMS = [
  { title: 'GDPR Compliance', status: 'Compliant', description: 'User data protection and privacy', icon: Lock },
  { title: 'AML Policy', status: 'Active', description: 'Anti-Money Laundering controls', icon: AlertCircle },
  { title: 'KYC Requirements', status: 'Enforced', description: 'Know Your Customer verification', icon: FileText },
  { title: 'Risk Assessment', status: 'Updated', description: 'Latest regulatory risk assessment', icon: CheckCircle2 },
]

export function AdminComplianceView({ auditLogs }: { auditLogs: AdminAuditLogRow[] }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Compliance Center"
        description="Regulatory compliance and audit trail"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {COMPLIANCE_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.title} className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-start justify-between">
                <Icon className="h-8 w-8 text-primary" />
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                  {item.status}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="mb-4 text-lg font-bold">Admin Audit Log</h3>
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events recorded yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg bg-background p-4"
              >
                <div className="flex-1">
                  <p className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {log.module} · {log.admin_email ?? 'Admin'}
                    {log.reason_code ? ` · ${log.reason_code}` : ''}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
