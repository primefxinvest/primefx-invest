'use client'

import { Link } from '@/i18n/navigation'
import {
  Bot,
  Building2,
  Globe,
  Headphones,
  Heart,
  Lock,
  Mail,
  MapPin,
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

const SUPPORT_EMAIL = 'support@primefxinvest.com'

const STATS = [
  { value: 120, format: (n: number) => `${Math.round(n)}K+`, label: 'Active Investors' },
  { value: 48, format: (n: number) => `$${Math.round(n)}M+`, label: 'Total Invested' },
  { value: 150, format: (n: number) => `${Math.round(n)}+`, label: 'Countries Served' },
  { value: 99.98, format: (n: number) => `${n.toFixed(2)}%`, label: 'Platform Uptime' },
] as const

const CORE_VALUES = [
  {
    icon: Shield,
    title: 'Transparency',
    desc: 'Clear fees, honest communication, and accessible documentation at every step.',
  },
  {
    icon: Lock,
    title: 'Security',
    desc: 'Institutional-grade protection for accounts, wallets, and investor data.',
  },
  {
    icon: Heart,
    title: 'Integrity',
    desc: 'Ethical operations built on trust, accountability, and fair treatment.',
  },
  {
    icon: Users,
    title: 'Investor-First',
    desc: 'Every product decision is evaluated against investor clarity and protection.',
  },
] as const

const TRUST_PILLARS = [
  'Transparent fee structure with no hidden charges',
  'Identity verification required for financial operations',
  'Comprehensive legal documentation and risk disclosures',
  'Encrypted infrastructure and continuous fraud monitoring',
  'Dedicated customer support and PrimeAI investor assistance',
] as const

const ECOSYSTEM = [
  {
    icon: TrendingUp,
    title: 'Invest',
    href: '/invest',
    desc: 'Structured investment plans with weekly distributions.',
  },
  {
    icon: Zap,
    title: 'Wallet',
    href: '/wallet',
    desc: 'Crypto deposits, withdrawals, and instant internal transfers.',
  },
  {
    icon: Bot,
    title: 'PrimeAI',
    href: '/primeai',
    desc: 'AI portfolio analysis and investment guidance.',
  },
  {
    icon: Sparkles,
    title: 'Academy',
    href: '/academy',
    desc: 'Investor education and financial literacy resources.',
  },
] as const

const ROADMAP = [
  'Expanded payment networks and fiat on-ramps',
  'Advanced portfolio analytics and reporting tools',
  'Enhanced PrimeAI strategy recommendations',
  'Regional support centers and localized investor services',
  'Native mobile applications for iOS and Android',
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
            An institutional-grade investment platform combining transparent technology, secure
            infrastructure, and global accessibility for investors worldwide.
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
            PrimeFx Invest is an international fintech platform providing structured investment
            plans, secure crypto wallets, AI-powered portfolio tools, and a comprehensive referral
            program. We combine professional capital management with transparent technology to deliver
            an institutional-grade experience accessible to investors across the globe.
          </p>
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Our Mission">
            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <Target className="mb-3 size-8 text-[#0052ff]" aria-hidden />
              <p className="text-sm leading-relaxed text-gray-600">
                To democratize investment opportunities and empower individuals worldwide with
                transparent tools, secure infrastructure, and intelligent guidance that make
                wealth building accessible, understandable, and trustworthy.
              </p>
            </MotionCard>
          </Section>
          <Section title="Our Vision">
            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <Globe className="mb-3 size-8 text-[#0052ff]" aria-hidden />
              <p className="text-sm leading-relaxed text-gray-600">
                To become a global standard for transparent, technology-driven investment
                platforms — transforming how people grow wealth with institutional security,
                human-centered design, and unwavering integrity.
              </p>
            </MotionCard>
          </Section>
        </div>

        <Section eyebrow="Culture" title="Our Core Values">
          <StaggerContainer className="grid gap-4 sm:grid-cols-2">
            {CORE_VALUES.map((value) => (
              <StaggerItem key={value.title}>
                <ValueCard {...value} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </Section>

        <Section eyebrow="Trust" title="Why Investors Trust PrimeFx">
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-gray-600">
            PrimeFx Invest is built on a foundation of transparency, security, and accountability.
            Investors trust our platform because we communicate clearly, protect capital diligently,
            and operate with institutional discipline across every product surface.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {TRUST_PILLARS.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section eyebrow="Security" title="Platform Security">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            Security is the foundation of our platform. We employ encryption, identity verification,
            multi-factor authentication, session protection, fraud monitoring, and continuous
            infrastructure hardening to protect every investor and every transaction.
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

        <Section eyebrow="Protection" title="Investor Protection">
          <ul className="max-w-3xl space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Transparent fee structure — internal transfers use a fixed $1.20 fee with no hidden
              charges
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Identity verification required before deposits, withdrawals, and transfers
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              Comprehensive legal documentation and risk disclosures in our Legal Center
            </li>
            <li className="flex gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0052ff]" aria-hidden />
              24/7 customer support and PrimeAI-assisted investor guidance
            </li>
          </ul>
        </Section>

        <Section eyebrow="Infrastructure" title="Global Technology Infrastructure">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            PrimeFx Invest operates on modern cloud infrastructure with real-time data pipelines,
            encrypted storage, certified identity verification providers, and AI models powering
            PrimeAI. Our technology stack prioritizes performance, reliability, auditability, and
            global availability for investors in 150+ countries.
          </p>
        </Section>

        <Section eyebrow="Platform" title="Investment Platform">
          <p className="mb-6 max-w-3xl text-sm leading-relaxed text-gray-600">
            Our platform delivers structured investment plans, secure wallet operations, portfolio
            analytics, referral earnings, and educational resources — unified in a single
            institutional-grade investor dashboard.
          </p>
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

        <Section eyebrow="Compliance" title="Compliance Commitment">
          <p className="max-w-3xl text-sm leading-relaxed text-gray-600">
            PrimeFx Invest is committed to responsible platform operations, identity verification,
            anti-fraud monitoring, and transparent investor communications. We maintain comprehensive
            legal documentation, enforce verification requirements for financial actions, and
            continuously improve our compliance processes as the platform evolves.
          </p>
        </Section>

        <Section eyebrow="Support" title="Customer Support">
          <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <Headphones className="mb-3 size-8 text-[#0052ff]" aria-hidden />
            <p className="text-sm leading-relaxed text-gray-600">
              Our support team is available to assist investors with account questions, verification,
              wallet operations, and platform guidance. Reach us anytime at{' '}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-semibold text-[#0052ff] hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex rounded-xl bg-[#0052ff] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Contact Support
            </Link>
          </MotionCard>
        </Section>

        <Section eyebrow="Roadmap" title="Future Roadmap">
          <ul className="max-w-3xl space-y-2 text-sm text-gray-600">
            {ROADMAP.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#0052ff]">•</span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="contact" eyebrow="Contact" title="Contact Information">
          <div className="grid gap-6 lg:grid-cols-2">
            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-6 shrink-0 text-[#0052ff]" aria-hidden />
                <div>
                  <h3 className="font-semibold text-gray-900">Headquarters</h3>
                  <address className="mt-2 not-italic text-sm leading-relaxed text-gray-600">
                    Boulevard
                    <br />
                    Downtown Dubai
                    <br />
                    Dubai
                    <br />
                    United Arab Emirates
                    <br />
                    P.O. Box 9440
                  </address>
                </div>
              </div>
            </MotionCard>

            <MotionCard className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 size-6 shrink-0 text-[#0052ff]" aria-hidden />
                <div>
                  <h3 className="font-semibold text-gray-900">Support Email</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    For investor inquiries, account assistance, and platform support:
                  </p>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="mt-2 inline-block text-sm font-semibold text-[#0052ff] hover:underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </div>
              </div>
            </MotionCard>
          </div>

          <MotionCard className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-6 shrink-0 text-[#0052ff]" aria-hidden />
              <p className="text-sm leading-relaxed text-gray-700">
                PrimeFx Invest serves a global investor community with multilingual support,
                crypto-native financial operations, and institutional-grade platform security.
              </p>
            </div>
          </MotionCard>
        </Section>

        <Section id="trust" eyebrow="Principles" title="Trust Principles">
          <div className="rounded-2xl border border-[#0052ff]/20 bg-blue-50/50 p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-gray-700">
              PrimeFx Invest operates on five trust principles:{' '}
              <strong>Transparency</strong> in all fees and returns,{' '}
              <strong>Security</strong> at every layer,{' '}
              <strong>Compliance</strong> with responsible platform standards,{' '}
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
