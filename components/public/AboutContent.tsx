'use client'

import { Globe, Heart, TrendingUp, Users } from 'lucide-react'

export function AboutContent() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <h1 className="mb-2 text-4xl font-bold text-gray-900">About PrimeFx Invest</h1>
      <p className="mb-8 text-muted-foreground">Learn more about our mission and vision</p>

      <div className="space-y-12">
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Our Mission & Vision</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-3 text-xl font-semibold">Mission</h3>
              <p className="text-muted-foreground">
                To democratize investment opportunities and empower individuals worldwide with
                AI-powered tools that make intelligent wealth building accessible, transparent, and
                secure for everyone.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-3 text-xl font-semibold">Vision</h3>
              <p className="text-muted-foreground">
                To become the global leader in AI-powered investment platforms, transforming how
                people grow their wealth across 150+ countries through cutting-edge technology and
                expert guidance.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">By The Numbers</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { value: '120K+', label: 'Active Investors' },
              { value: '$250M+', label: 'Assets Under Management' },
              { value: '24.8%', label: 'Average Annual Returns' },
              { value: '150+', label: 'Countries Served' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-card p-6 text-center"
              >
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-2 text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Our Core Values</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Heart,
                title: 'Innovation',
                desc: 'Continuously advancing with cutting-edge AI technology',
              },
              {
                icon: Users,
                title: 'Community',
                desc: 'Building a vibrant investor community worldwide',
              },
              {
                icon: Globe,
                title: 'Accessibility',
                desc: 'Making professional-grade investing available to all',
              },
              {
                icon: TrendingUp,
                title: 'Growth',
                desc: 'Committed to sustainable wealth creation',
              },
            ].map((value) => (
              <div key={value.title} className="rounded-lg border border-border bg-card p-6">
                <value.icon className="mb-3 h-8 w-8 text-primary" />
                <h3 className="mb-2 font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-primary/20 bg-primary/10 p-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">Global Expansion Vision</h2>
          <p className="mb-4 text-muted-foreground">
            PrimeFx Invest is expanding rapidly across continents, bringing world-class investment
            opportunities to emerging markets while maintaining the highest standards of security
            and compliance.
          </p>
          <p className="text-muted-foreground">
            Our vision is to establish local partnerships, provide multilingual support, and adapt
            our platform to serve diverse investor needs across every major region.
          </p>
        </section>
      </div>
    </div>
  )
}
