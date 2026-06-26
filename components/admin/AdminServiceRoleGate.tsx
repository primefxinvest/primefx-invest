import { AdminServiceRoleBanner } from '@/components/admin/AdminServiceRoleBanner'
import { getServiceRoleKeyIssue } from '@/lib/supabase/admin-server'

export function AdminServiceRoleGate() {
  const issue = getServiceRoleKeyIssue()
  if (!issue) return null
  return <AdminServiceRoleBanner issue={issue} />
}
