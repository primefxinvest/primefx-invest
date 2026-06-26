'use client'

import { FileText, Shield, AlertCircle, Lock } from 'lucide-react'

export default function LegalPage() {
  const documents = [
    {
      icon: FileText,
      title: 'Terms of Service',
      desc: 'Our terms and conditions for using PrimeFx Invest',
      link: '#terms'
    },
    {
      icon: Shield,
      title: 'Privacy Policy',
      desc: 'How we collect, use, and protect your data',
      link: '#privacy'
    },
    {
      icon: AlertCircle,
      title: 'Risk Disclosure',
      desc: 'Important information about investment risks',
      link: '#risks'
    },
    {
      icon: Lock,
      title: 'Compliance Framework',
      desc: 'Our regulatory compliance and certifications',
      link: '#compliance'
    },
  ]

  return (
    <div className="flex-1 p-6 lg:p-10 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Legal Center</h1>
        <p className="text-muted-foreground mb-8">Important legal documents and compliance information</p>

        {/* Documents Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {documents.map((doc, i) => (
            <a
              key={i}
              href={doc.link}
              className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <doc.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">{doc.title}</h3>
              <p className="text-muted-foreground text-sm">{doc.desc}</p>
            </a>
          ))}
        </div>

        {/* Terms Section */}
        <section id="terms" className="mb-12 bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Terms of Service</h2>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
            <p>These Terms of Service govern your use of PrimeFx Invest platform. By accessing and using our services, you agree to be bound by these terms.</p>
            <p>Users must be at least 18 years old and comply with all applicable laws and regulations in their jurisdiction.</p>
            <p>Investment decisions carry inherent risks. Past performance does not guarantee future results. Always conduct your own research and consult with a financial advisor.</p>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" className="mb-12 bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
            <p>We are committed to protecting your privacy. Our Privacy Policy outlines how we collect, use, and safeguard your personal information.</p>
            <p>We use industry-standard encryption (256-bit SSL) to protect all data transmitted through our platform.</p>
            <p>Your data is never shared with third parties without your explicit consent, except as required by law.</p>
          </div>
        </section>

        {/* Risk Disclosure */}
        <section id="risks" className="mb-12 bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Risk Disclosure</h2>
          <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
            <p>Investment in financial markets involves substantial risk of loss. No investment strategy is guaranteed to succeed.</p>
            <p>Forex, cryptocurrency, and stock investments can result in significant losses. Only invest money you can afford to lose.</p>
            <p>Past performance, projections, and forward-looking statements do not guarantee future results.</p>
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="bg-primary/10 border border-primary/20 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Compliance Framework</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>PrimeFx Invest operates in compliance with international financial regulations:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Anti-Money Laundering (AML) Policies</li>
              <li>Know Your Customer (KYC) Verification</li>
              <li>Data Protection Regulations (GDPR)</li>
              <li>Financial Conduct Authority (FCA) Standards</li>
              <li>Bank-Level Security (256-bit Encryption)</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
