'use client'

import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import type { AdminAuditLogRow } from '@/lib/admin/types'
import { formatDateTime } from '@/lib/data/format'

export function AdminComplianceView({ auditLogs }: { auditLogs: AdminAuditLogRow[] }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Compliance Center"
        description="Admin audit trail and compliance activity"
      />

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
