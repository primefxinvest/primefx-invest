'use client'

import { AlertTriangle } from 'lucide-react'

export function AdminServiceRoleBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">Admin data access not configured</p>
        <p className="mt-1 text-amber-800">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to your
          environment and run migration <code className="rounded bg-amber-100 px-1">004_admin_system.sql</code>.
          Grant admin access via <code className="rounded bg-amber-100 px-1">admin_profiles</code> or{' '}
          <code className="rounded bg-amber-100 px-1">ADMIN_SUPER_EMAILS</code>.
        </p>
      </div>
    </div>
  )
}
