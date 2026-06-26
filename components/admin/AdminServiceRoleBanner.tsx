import { AlertTriangle } from 'lucide-react'
import type { ServiceRoleKeyIssue } from '@/lib/supabase/admin-server'

const ISSUE_COPY: Record<ServiceRoleKeyIssue, { title: string; body: string }> = {
  missing: {
    title: 'Admin data access is not configured',
    body: 'Add SUPABASE_SERVICE_ROLE_KEY to your .env file, then restart the dev server.',
  },
  'same-as-anon': {
    title: 'Wrong Supabase key in SUPABASE_SERVICE_ROLE_KEY',
    body: 'You pasted the anon/publishable key. In Supabase go to Project Settings → API and copy the service_role secret key instead.',
  },
  'wrong-role': {
    title: 'SUPABASE_SERVICE_ROLE_KEY is not a service role key',
    body: 'This key is valid JWT but its role is not service_role (often the anon key). Copy the service_role secret from Supabase → Project Settings → API.',
  },
  'invalid-format': {
    title: 'SUPABASE_SERVICE_ROLE_KEY looks invalid',
    body: 'Use the service_role secret from Supabase → Project Settings → API. It should be a long JWT starting with eyJ.',
  },
}

export function AdminServiceRoleBanner({ issue = 'missing' }: { issue?: ServiceRoleKeyIssue }) {
  const copy = ISSUE_COPY[issue]

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{copy.title}</p>
        <p className="mt-1 text-amber-800">{copy.body}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-amber-800">
          <li>Never expose the service role key in the browser or commit it to Git.</li>
          <li>Run migrations 004_admin_system.sql and 005_signup_bootstrap.sql in Supabase SQL Editor.</li>
          <li>Grant access with ADMIN_SUPER_EMAILS or an admin_profiles row.</li>
        </ul>
      </div>
    </div>
  )
}
