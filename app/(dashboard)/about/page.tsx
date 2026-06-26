'use client'

import { Users, Globe, TrendingUp, Heart } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="flex-1 p-6 lg:p-10 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">About PrimeFx Invest</h1>
        <p className="text-muted-foreground mb-8">Learn more about our mission and vision</p>

        <div className="space-y-12">
          {/* Mission & Vision */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Our Mission & Vision</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Mission</h3>
                <p className="text-muted-foreground">
                  To democratize investment opportunities and empower individuals worldwide with AI-powered tools that make intelligent wealth building accessible, transparent, and secure for everyone.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">Vision</h3>
                <p className="text-muted-foreground">
                  To become the global leader in AI-powered investment platforms, transforming how people grow their wealth across 150+ countries through cutting-edge technology and expert guidance.
                </p>
              </div>
            </div>
          </section>

          {/* Key Metrics */}
          <section>
            <h2 className="text-2xl font-bold mb-6">By The Numbers</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary">120K+</div>
                <div className="text-muted-foreground mt-2">Active Investors</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary">$250M+</div>
                <div className="text-muted-foreground mt-2">Assets Under Management</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-accent">24.8%</div>
                <div className="text-muted-foreground mt-2">Average Annual Returns</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-primary">150+</div>
                <div className="text-muted-foreground mt-2">Countries Served</div>
              </div>
            </div>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-2xl font-bold mb-6">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Heart, title: 'Innovation', desc: 'Continuously advancing with cutting-edge AI technology' },
                { icon: Users, title: 'Community', desc: 'Building a vibrant investor community worldwide' },
                { icon: Globe, title: 'Accessibility', desc: 'Making professional-grade investing available to all' },
                { icon: TrendingUp, title: 'Growth', desc: 'Committed to sustainable wealth creation' },
              ].map((value, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-6">
                  <value.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Global Expansion */}
          <section className="bg-primary/10 border border-primary/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Global Expansion Vision</h2>
            <p className="text-muted-foreground mb-4">
              PrimeFx Invest is expanding rapidly across continents, bringing world-class investment opportunities to emerging markets while maintaining the highest standards of security and compliance.
            </p>
            <p className="text-muted-foreground">
              Our vision is to establish local partnerships, provide multilingual support, and adapt our platform to serve diverse investor needs across every major region.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
