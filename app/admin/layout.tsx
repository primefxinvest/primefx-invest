import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BarChart3, Users, FileText, Zap, Wallet, Lock, Award, TrendingUp, LogOut, Menu } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image
              src="/logo.png"
              alt="PrimeFx"
              width={40}
              height={40}
              className="object-contain"
            />
            <div>
              <div className="font-bold text-foreground">PrimeFx</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { href: '/admin', label: 'Dashboard', icon: BarChart3 },
            { href: '/admin/users', label: 'User Management', icon: Users },
            { href: '/admin/kyc', label: 'KYC Verification', icon: FileText },
            { href: '/admin/plans', label: 'Investment Plans', icon: Zap },
            { href: '/admin/wallets', label: 'Wallet Management', icon: Wallet },
            { href: '/admin/transactions', label: 'Transactions', icon: TrendingUp },
            { href: '/admin/rewards', label: 'Rewards', icon: Award },
            { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
            { href: '/admin/compliance', label: 'Compliance', icon: Lock },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm">Back to App</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Admin Portal</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Admin User</div>
            <div className="h-10 w-10 rounded-full bg-primary"></div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
