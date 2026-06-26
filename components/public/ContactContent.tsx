'use client'

import Link from 'next/link'
import { Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { useAuthEntry } from '@/lib/hooks/useAuthEntry'

export function ContactContent() {
  const { isAuthenticated, dashboardHref, loginHref, signupHref, signupLabel } = useAuthEntry()
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Contact Us</h1>
      <p className="mb-8 text-muted-foreground">
        Get in touch with the PrimeFx Invest team. We are here to help with account questions,
        compliance, and general inquiries.
      </p>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {[
          {
            icon: Mail,
            title: 'Email',
            value: 'support@primefxinvest.com',
            href: 'mailto:support@primefxinvest.com',
          },
          {
            icon: Phone,
            title: 'Phone',
            value: '+1 (800) 555-0199',
            href: 'tel:+18005550199',
          },
          {
            icon: MapPin,
            title: 'Office',
            value: 'London, United Kingdom',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border border-border bg-card p-6">
            <item.icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">{item.title}</h3>
            {item.href ? (
              <a href={item.href} className="text-sm text-primary hover:underline">
                {item.value}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Already have an account?</h2>
            <p className="mt-2 text-muted-foreground">
              Logged-in investors can open a support ticket from the dashboard for faster account
              assistance.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {isAuthenticated ? (
                <Link
                  href={dashboardHref}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href={loginHref}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Sign in for support
                  </Link>
                  <Link
                    href={signupHref}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    {signupLabel}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
