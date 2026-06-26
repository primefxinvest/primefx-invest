'use client'

import { Search, Bell, Globe, Settings, LogOut } from 'lucide-react'

interface NavbarProps {
  userName?: string
  userTier?: string
  notificationCount?: number
}

export default function Navbar({ userName = 'John Doe', userTier = 'Elite Investor', notificationCount = 1 }: NavbarProps) {
  return (
    <header className="fixed right-0 top-0 left-64 border-b border-border bg-card px-8 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 flex-1 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for anything..."
            className="flex-1 bg-transparent text-sm outline-none placeholder-muted-foreground"
          />
          <span className="text-xs text-muted-foreground">⌘K</span>
        </div>

        {/* Right Side Items */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative rounded-lg p-2 hover:bg-secondary transition-colors">
            <Bell className="h-5 w-5 text-foreground" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <Settings className="h-5 w-5 text-foreground" />
          </button>

          {/* Language */}
          <button className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <Globe className="h-5 w-5 text-foreground" />
          </button>

          {/* User Profile Dropdown */}
          <div className="flex items-center gap-3 border-l border-border pl-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userTier}</p>
            </div>
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=john"
              alt={userName}
              className="h-8 w-8 rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
