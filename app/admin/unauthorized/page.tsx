import Link from 'next/link'
import { ShieldX } from 'lucide-react'
import Logo from '@/components/shared/Logo'

export default function AdminUnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <Logo showText={false} size={56} />
        </div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <ShieldX className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This area is restricted to authorized PrimeFx staff. Your account does not have permission
          to open the admin portal.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          If you need admin access for your organization, please contact your PrimeFx account
          administrator or our support team.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/contact"
            className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            Contact Support
          </Link>
          <Link href="/auth/signout" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  )
}
