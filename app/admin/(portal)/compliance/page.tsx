import { AdminComplianceView } from '@/components/admin/AdminComplianceView'
import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { requireAdminModule } from '@/lib/admin/auth'
import { getAdminAuditLogs } from '@/lib/admin/queries'
import { withAdminData } from '@/lib/admin/safe-query'

export default async function AdminCompliancePage() {
  await requireAdminModule('audit_logs')
  const { data, error, configured } = await withAdminData(() => getAdminAuditLogs(50), [])

  return (
    <>
      {!configured ? <AdminServiceRoleBanner /> : null}
      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <AdminComplianceView auditLogs={data} />
    </>
  )
}
