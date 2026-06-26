import { CheckCircle2, AlertTriangle, Settings2 } from 'lucide-react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { AdminSecurityCard } from '@/components/admin/AdminSecurityCard'
import type { PlatformSettingsSnapshot } from '@/lib/admin/platform-settings'
import { cn } from '@/lib/utils'

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
      )}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      {label}
    </span>
  )
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  )
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/60 pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="break-all text-sm font-medium text-foreground sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  )
}

export function AdminSettingsView({ settings }: { settings: PlatformSettingsSnapshot }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Platform Settings"
        description="Super Admin configuration for payments, database access, and platform operations."
      />

      <AdminSecurityCard />

      <SettingsCard title="Admin access" description="Your current admin session and access mode.">
        <ConfigRow label="Signed in as" value={settings.adminEmail} />
        <ConfigRow label="Role" value={settings.adminTier} />
        <div className="flex flex-wrap gap-2 pt-1">
          <StatusBadge ok={!settings.isBootstrapAdmin} label={settings.isBootstrapAdmin ? 'Bootstrap access' : 'Database admin profile'} />
          <StatusBadge ok={settings.serviceRoleConfigured} label={settings.serviceRoleConfigured ? 'Service role OK' : 'Service role missing'} />
        </div>
        {settings.serviceRoleIssue ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {settings.serviceRoleIssue}
          </p>
        ) : null}
      </SettingsCard>

      <SettingsCard
        title="Payment providers"
        description="Configure credentials in .env and register webhook URLs in each provider dashboard."
      >
        <ConfigRow label="Payment mode" value={settings.paymentMode} />
        <ConfigRow label="Webhook base URL" value={settings.webhookBaseUrl} />

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">Binance Pay</span>
            </div>
            <StatusBadge ok={settings.binancePay.configured} label={settings.binancePay.configured ? 'Configured' : 'Not configured'} />
          </div>
          <ConfigRow label="Webhook URL" value={settings.binancePay.webhookUrl} />
          {settings.binancePay.missing.length > 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              Missing: {settings.binancePay.missing.join(', ')}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">NOWPayments</span>
            </div>
            <StatusBadge ok={settings.nowPayments.configured} label={settings.nowPayments.configured ? 'Configured' : 'Not configured'} />
          </div>
          <ConfigRow label="Deposit IPN URL" value={settings.nowPayments.webhookUrl} />
          <ConfigRow label="Payout IPN URL" value={settings.nowPayments.payoutWebhookUrl} />
          {settings.nowPayments.missing.length > 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              Missing: {settings.nowPayments.missing.join(', ')}
            </p>
          ) : null}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Database migrations"
        description="Run these SQL files in Supabase SQL Editor if tables or admin data are missing."
      >
        <ul className="space-y-2">
          {settings.requiredMigrations.map((migration) => (
            <li
              key={migration}
              className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs text-foreground"
            >
              supabase/migrations/{migration}
            </li>
          ))}
        </ul>
      </SettingsCard>
    </div>
  )
}
