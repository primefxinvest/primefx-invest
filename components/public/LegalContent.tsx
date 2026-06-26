'use client'

import { useEffect } from 'react'
import { AlertCircle, FileText, Lock, Shield } from 'lucide-react'

const documents = [
  {
    icon: FileText,
    title: 'Terms of Service',
    desc: 'Our terms and conditions for using PrimeFx Invest',
    link: '#terms',
  },
  {
    icon: Shield,
    title: 'Privacy Policy',
    desc: 'How we collect, use, and protect your data',
    link: '#privacy',
  },
  {
    icon: AlertCircle,
    title: 'Risk Disclosure',
    desc: 'Important information about investment risks',
    link: '#risks',
  },
  {
    icon: Lock,
    title: 'Compliance Framework',
    desc: 'Our regulatory compliance and certifications',
    link: '#compliance',
  },
] as const

export function LegalContent() {
  useEffect(() => {
    if (!window.location.hash) return
    const target = document.querySelector(window.location.hash)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">Legal Center</h1>
      <p className="mb-8 text-muted-foreground">
        Important legal documents and compliance information
      </p>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        {documents.map((doc) => (
          <a
            key={doc.title}
            href={doc.link}
            className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
          >
            <doc.icon className="mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">{doc.title}</h3>
            <p className="text-sm text-muted-foreground">{doc.desc}</p>
          </a>
        ))}
      </div>

      <section id="terms" className="mb-12 scroll-mt-24 rounded-lg border border-border bg-card p-8">
        <h2 className="mb-4 text-2xl font-bold">Terms of Service</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            These Terms of Service govern your use of PrimeFx Invest platform. By accessing and
            using our services, you agree to be bound by these terms.
          </p>
          <p>
            Users must be at least 18 years old and comply with all applicable laws and regulations
            in their jurisdiction.
          </p>
          <p>
            Investment decisions carry inherent risks. Past performance does not guarantee future
            results. Always conduct your own research and consult with a financial advisor.
          </p>
        </div>
      </section>

      <section
        id="privacy"
        className="mb-12 scroll-mt-24 rounded-lg border border-border bg-card p-8"
      >
        <h2 className="mb-4 text-2xl font-bold">Privacy Policy</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            We are committed to protecting your privacy. Our Privacy Policy outlines how we collect,
            use, and safeguard your personal information.
          </p>
          <p>
            We use industry-standard encryption (256-bit SSL) to protect all data transmitted
            through our platform.
          </p>
          <p>
            Your data is never shared with third parties without your explicit consent, except as
            required by law.
          </p>
        </div>
      </section>

      <section id="risks" className="mb-12 scroll-mt-24 rounded-lg border border-border bg-card p-8">
        <h2 className="mb-4 text-2xl font-bold">Risk Disclosure</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Investment in financial markets involves substantial risk of loss. No investment strategy
            is guaranteed to succeed.
          </p>
          <p>
            Forex, cryptocurrency, and stock investments can result in significant losses. Only
            invest money you can afford to lose.
          </p>
          <p>
            Past performance, projections, and forward-looking statements do not guarantee future
            results.
          </p>
        </div>
      </section>

      <section
        id="compliance"
        className="scroll-mt-24 rounded-lg border border-primary/20 bg-primary/10 p-8"
      >
        <h2 className="mb-4 text-2xl font-bold">Compliance Framework</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>PrimeFx Invest operates in compliance with international financial regulations:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Anti-Money Laundering (AML) Policies</li>
            <li>Know Your Customer (KYC) Verification</li>
            <li>Data Protection Regulations (GDPR)</li>
            <li>Financial Conduct Authority (FCA) Standards</li>
            <li>Bank-Level Security (256-bit Encryption)</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
