'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Home,
  TrendingUp,
  PieChart,
  Wallet,
  History,
  Zap,
  BookOpen,
  FileText,
  Trophy,
  Users,
  Share2,
  Barcode,
  MessageSquare,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/invest', label: 'Invest', icon: TrendingUp },
  { href: '/portfolio', label: 'Portfolio', icon: PieChart },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: History },
  { href: '/primeai', label: 'PrimeAI', icon: Zap },
  { href: '/academy', label: 'Academy', icon: BookOpen },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/rewards', label: 'Rewards', icon: Trophy },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/referral', label: 'Referral Center', icon: Share2 },
  { href: '/market-insights', label: 'Market Insights', icon: Barcode },
  { href: '/support', label: 'Support', icon: MessageSquare },
]

const bottomNavItems = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/about', label: 'About', icon: HelpCircle },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-sidebar shadow-sm">
      {/* Logo */}
      <Link href="/dashboard" className="block border-b border-border p-6 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="PrimeFx Invest"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
          <div className="flex flex-col">
            <span className="font-bold text-foreground">PrimeFx</span>
            <span className="text-xs text-muted-foreground">INVEST</span>
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Upgrade Banner */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                <span className="text-sm font-semibold">Upgrade to Elite</span>
              </div>
              <p className="mt-2 text-xs text-blue-100">Unlock exclusive benefits and higher returns</p>
              <button className="mt-3 w-full rounded-lg bg-white py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-border px-4 py-4">
        <div className="space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname.startsWith(item.href)

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Logout */}
      <div className="border-t border-border p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
