'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Logo from '@/components/shared/Logo'

const navLinks = [
  { href: '/', label: 'Home', active: true },
  { href: '/invest', label: 'Invest' },
  { href: '/about', label: 'About Us' },
  { href: '/academy', label: 'Academy' },
  { href: '/market-insights', label: 'Market Insights' },
  { href: '/community', label: 'Community' },
  { href: '/support', label: 'Support' },
]

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Logo href="/" size={36} className="shrink-0" />

          {/* Desktop links */}
          <div className="hidden items-center gap-1 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                  link.active
                    ? 'text-[#0052ff]'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
                {link.active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#0052ff]" />
                )}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:inline-flex"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-[#0052ff] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/25 transition-colors hover:bg-blue-700"
            >
              Get Started
            </Link>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 xl:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 py-4 xl:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    link.active ? 'bg-blue-50 text-[#0052ff]' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="mt-2 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-semibold text-gray-700"
                onClick={() => setMobileOpen(false)}
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
