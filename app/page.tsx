'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, TrendingUp, BarChart3, Users, Zap, Shield, Smartphone } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="PrimeFx Invest"
                width={32}
                height={32}
                className="object-contain"
              />
              <span className="font-bold text-lg text-foreground">PrimeFx</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-sm hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-sm hover:text-primary transition-colors">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-balance">
                Invest Smarter with
                <span className="block text-primary">AI-Powered Insights</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-lg">
                PrimeAI combines cutting-edge artificial intelligence with professional investment expertise to help you make confident, data-driven investment decisions.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-8 py-3 font-semibold hover:bg-secondary transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative h-96 md:h-full hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl" />
              <div className="flex items-center justify-center h-full">
                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 bg-secondary rounded" />
                    <div className="h-4 w-1/2 bg-secondary rounded" />
                    <div className="mt-6 h-24 bg-secondary rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { number: '50K+', label: 'Active Investors' },
              { number: '$2B+', label: 'Assets Under Management' },
              { number: '98%', label: 'Customer Satisfaction' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-4xl font-bold text-primary">{stat.number}</p>
                <p className="mt-2 text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground">Powerful Features</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to make informed investment decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'AI Portfolio Analysis',
                description: 'Get real-time analysis of your portfolio with AI-powered recommendations.',
              },
              {
                icon: TrendingUp,
                title: 'Market Insights',
                description: 'Stay ahead with real-time market trends and investment opportunities.',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Connect with other investors and share investment strategies.',
              },
              {
                icon: Zap,
                title: 'Quick Execution',
                description: 'Execute trades and manage investments with our intuitive platform.',
              },
              {
                icon: Shield,
                title: 'Security First',
                description: 'Bank-level security and encryption protect your data and assets.',
              },
              {
                icon: Smartphone,
                title: 'Mobile Access',
                description: 'Trade on the go with our mobile-optimized platform.',
              },
            ].map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className="rounded-lg border border-border bg-card p-8 hover:shadow-lg transition-shadow">
                  <div className="rounded-lg bg-primary/10 p-3 w-fit mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Three simple steps to start investing smarter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Account',
                description: 'Sign up and complete quick KYC verification to get started.',
              },
              {
                step: '02',
                title: 'Fund Your Wallet',
                description: 'Add funds through various payment methods and start investing.',
              },
              {
                step: '03',
                title: 'Get AI Guidance',
                description: 'Receive personalized recommendations and manage your portfolio.',
              },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl font-bold text-primary mb-4">{item.step}</div>
                <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground">Simple Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Choose the plan that&apos;s right for you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Basic',
                price: 'Free',
                features: ['Unlimited trades', 'Basic analytics', 'Community access', 'Email support'],
              },
              {
                name: 'Premium',
                price: '$9.99',
                period: '/month',
                features: ['Advanced AI analysis', 'Priority support', 'Custom reports', 'Academy access', 'No trading fees'],
                highlighted: true,
              },
              {
                name: 'Elite',
                price: '$29.99',
                period: '/month',
                features: ['Personal advisor', 'Advanced strategies', 'Phone support', 'Private webinars', 'Custom portfolios'],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`rounded-lg border p-8 ${
                  plan.highlighted
                    ? 'border-primary bg-primary/5 shadow-lg md:scale-105'
                    : 'border-border bg-card'
                }`}
              >
                <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  className={`mt-8 w-full rounded-lg px-6 py-3 font-semibold transition-colors ${
                    plan.highlighted
                      ? 'bg-primary text-white hover:bg-blue-700'
                      : 'border border-border hover:bg-secondary'
                  }`}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-card py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to invest smarter?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of investors using PrimeAI to make better investment decisions.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Start Your Free Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold">
                  P
                </div>
                <span className="font-bold text-foreground">PrimeAI</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered investment platform for smarter decisions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 PrimeAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
