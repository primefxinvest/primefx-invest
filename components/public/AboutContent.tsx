'use client'

import { Link } from '@/i18n/navigation'
import {
  Bot,
  Globe,
  Heart,
  Lock,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatedNumber } from '@/lib/motion/animated-number'
import { MotionCard } from '@/lib/motion/motion-card'
import { StaggerContainer, StaggerItem } from '@/lib/motion/stagger'
import { cn } from '@/lib/utils'

const STATS = [
  { value: 120, format: (n: number) => `${Math.round(n)}K+`, label: 'Active Investors' },
  { value: 48, format: (n: number) => `$${Math.round(n)}M+`, label: 'Total Invested' },
  { value: 150, format: (n: number) => `${Math.round(n)}+`, label: 'Countries Served' },
  { value: 99.98, format: (n: number) => `${n.toFixed(2)}%`, label: 'Platform Uptime' },
] as const

const VALUES = [
  { icon: Shield, title: 'Transparency', desc: 'Clear fees, honest communication, and accessible documentation.' },
  { icon: Lock, title: 'Security', desc: 'Institutional-grade protection for every account and transaction.' },
  { icon: Heart, title: 'Integrity', desc: 'Ethical operations built on trust and regulatory compliance.' },
  { icon: Users, title: 'Community', desc: 'A global investor community supported 24/7.' },
] as const

const MILESTONES = [
  { year: '2020', title: 'Platform Founded', desc: 'PrimeFx Invest launched with a mission to democratize professional investing.' },
  { year: '2022', title: 'Global Expansion', desc: 'Expanded to 100+ countries with multilingual support.' },
  { year: '2024', title: 'PrimeAI Launch', desc: 'Introduced AI-powered portfolio insights and investor assistance.' },
  { year: '2026', title: 'Institutional Grade', desc: 'Full legal center, KYC integration, and enterprise security stack.' },
] as const

const ECOSYSTEM = [
  { icon: TrendingUp, title: 'Invest', href: '/invest', desc: 'Structured investment plans with weekly distributions.' },
  { icon: Zap, title: 'Wallet', href: '/wallet', desc: 'Crypto deposits, withdrawals, and instant transfers.' },
  { icon: Bot, title: 'PrimeAI', href: '/primeai', desc: 'AI portfolio analysis and investment guidance.' },
  { icon: Sparkles, title: 'Academy', href: '/academy', desc: 'Investor education and financial literacy.' },
] as const

function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id?: string
  eyebrow?: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('scroll-mt-24', className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-widest text-[#0052ff] uppercase">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function ValueCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <Icon className="mb-3 size-8 text-[#0052ff]" aria-hidden />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
    </MotionCard>
  )
}

export function AboutContent() {
  return (
    <div className="min-w-0 overflow-x-hidden">
      <header className="bg-gradient-to-b from-blue-50/80 via-white to-white py-14 sm:py-20">
        <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold tracking-widest text-[#0052ff] uppercase">Company</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold text-gray-900 sm:text-4xl lg:text-5xl">
            About PrimeFx Invest
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 sm:text-lg">
            A global institutional investment platform built on transparency, security, and
            intelligent technology — serving investors in 150+ countries.
          </p>
        </div>
      </header>

      <div className="border-y border-gray-200 bg-white py-10">
        <StaggerContainer className="mx-auto grid max-w-8xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          {STATS.map((stat) => (
            <StaggerItem key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-[#0052ff] sm:text-3xl">
                <AnimatedNumber value={stat.value} format={stat.format} />
              </p>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <div className="mx-auto max-w-8xl space-y-16 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <Section eyebrow="Overview" title="Company Overview">
          <p className="max-w-3xl text-base leading-relaxed text-gray-600">
            PrimeFx Invest is an international fintech platform that provides structured investment
            plans, secure crypto wallets, AI-powered portfolio tools, and a comprehensive referral
            program. We combine professional capital management with transparent technology to deliver
            an institutional-grade experience accessible to investors worldwide.
          </p>
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Our Mission">
            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <Target className="mb-3 size-8 text-[#0052ff]" aria-hidden />
              <p className="text-sm leading-relaxed text-gray-600">
                To democratize investment opportunities and empower individuals worldwide with
                transparent tools, secure infrastructure, and AI-assisted guidance that make
                intelligent wealth building accessible to everyone.
              </p>
            </MotionCard>
          </Section>
          <Section title="Our Vision">
            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <Globe className="mb-3 size-8 text-[#0052ff]" aria-hidden />
              <p className="text-sm leading-relaxed text-gray-600">
                To become the global standard for transparent, technology-driven investment
                platforms — transforming how people grow wealth across every major region with
                institutional security and human-centered design.
              </p>
            </MotionCard>
          </Section>
        </div>

        <Section eyebrow="Culture" title="Our Values">
          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <ValueCard {...v} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Section>

        <Section eyebrow="Timeline" title="Milestones">
          <div className="relative space-y-6 border-l-2 border-blue-100 pl-8">
            {MILESTONES.map((m) => (
              <MotionCard
                key={m.year}
                interactive={false}
                className="relative rounded-xl border border-gray-100 bg-gray-50/50 p-5"
              >
                <span className="absolute -left-[2.55rem] flex size-8 items-center justify-center rounded-full bg-[#0052ff] text-xs font-bold text-white">
                  {m.year.slice(2)}
                </span>
                <p className="text-xs font-semibold text-[#0052ff]">{m.year}</p>
                <h3 className="mt-1 font-bold text-gray-900">{m.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{m.desc}</p>
              </MotionCard>
            ))}
          </div>
        </Section>

        <Section eyebrow="Global" title="Global Accessibility">
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-gray-600">
            PrimeFx Invest serves investors across 150+ countries with multilingual support,
            crypto-native deposits and withdrawals, and 24/7 customer assistance. Our platform is
            designed for global accessibility without compromising security or compliance.
          </p>
          <MotionCard className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-8 text-center">
            <Globe className="mx-auto size-12 text-[#0052ff]" aria-hidden />
            <p className="mt-4 text-3xl font-bold text-gray-900">150+ Countries</p>
            <p className="mt-2 text-sm text-gray-600">Invest from anywhere. Grow everywhere.</p>
          </MotionCard>
        </Section>

        <Section eyebrow="Security" title="Security Philosophy">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Security is not a feature — it is the foundation. We employ encryption, identity
            verification, multi-factor authentication, session protection, fraud monitoring, and
            continuous infrastructure hardening to protect every investor.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {['Encryption', 'KYC Verification', 'Fraud Monitoring'].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700"
              >
                <ShieldCheck className="size-4 text-emerald-500" aria-hidden />
                {item}
              </div>
            ))}
          </div>
        </Section>

        <Section eyebrow="Technology" title="Technology Stack">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Built on modern cloud infrastructure with Next.js, real-time data pipelines, Supabase
            security, certified KYC providers (Didit), and AI models powering PrimeAI. Our stack
            prioritizes performance, reliability, and auditability.
          </p>
        </Section>

        <Section eyebrow="Protection" title="Investor Protection">
          <ul className="max-w-3xl space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Transparent fee structure with no hidden charges
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Identity verification required for all financial operations
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Comprehensive legal documentation and risk disclosures
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              24/7 support and AI-assisted investor guidance
            </li>
          </ul>
        </Section>

        <Section eyebrow="AI" title="PrimeAI Vision">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            PrimeAI is our intelligent investment assistant — designed to help investors analyze
            portfolios, compare plans, understand risks, and build strategies. PrimeAI augments
            human decision-making; it does not replace professional financial advice.
          </p>
        </Section>

        <Section eyebrow="Purpose" title="Why PrimeFx Exists">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Traditional investment platforms often hide fees, restrict access, and lack transparency.
            PrimeFx Invest was created to change that — offering institutional-quality tools,
            honest communication, and global access to structured investment opportunities.
          </p>
        </Section>

        <Section eyebrow="Ecosystem" title="Product Ecosystem">
          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {ECOSYSTEM.map((item) => {
              const Icon = item.icon
              return (
                <StaggerItem key={item.title}>
                  <Link href={item.href} className="block">
                    <MotionCard className="h-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <Icon className="mb-2 size-6 text-[#0052ff]" aria-hidden />
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-gray-600">{item.desc}</p>
                    </MotionCard>
                  </Link>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </Section>

        <Section eyebrow="Roadmap" title="Future Roadmap">
          <ul className="max-w-3xl space-y-2 text-sm text-gray-600">
            <li>• Expanded payment networks and fiat on-ramps</li>
            <li>• Advanced portfolio analytics and tax reporting tools</li>
            <li>• Enhanced PrimeAI strategy recommendations</li>
            <li>• Regional compliance partnerships and local support centers</li>
            <li>• Mobile-native applications for iOS and Android</li>
          </ul>
        </Section>

        <Section eyebrow="Leadership" title="Leadership Philosophy">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            We lead with transparency, accountability, and long-term thinking. Every product
            decision is evaluated against a single question: does this increase trust and clarity
            for our investors?
          </p>
        </Section>

        <Section id="trust" eyebrow="Principles" title="Trust Principles">
          <div className="rounded-2xl border border-[#0052ff]/20 bg-blue-50/50 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-gray-700">
              PrimeFx Invest operates on five trust principles:{' '}
              <strong>Transparency</strong> in all fees and returns,{' '}
              <strong>Security</strong> at every layer,{' '}
              <strong>Compliance</strong> with international standards,{' '}
              <strong>Accessibility</strong> for global investors, and{' '}
              <strong>Accountability</strong> in every interaction.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/how-primefx-works"
                className="rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                How PrimeFx Works
              </Link>
              <Link
                href="/legal"
                className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                Legal Center
              </Link>
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}
