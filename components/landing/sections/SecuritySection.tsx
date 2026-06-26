import Link from 'next/link'
import { ArrowRight, Lock, Fingerprint, Server, ShieldCheck, Eye } from 'lucide-react'

const securityFeatures = [
  { icon: Lock, label: '256-bit SSL Encryption' },
  { icon: Fingerprint, label: 'Two-Factor Authentication' },
  { icon: Server, label: 'Cold Storage Wallets' },
  { icon: ShieldCheck, label: 'Regulatory Compliance' },
  { icon: Eye, label: 'Real-Time Monitoring' },
]

export default function SecuritySection() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-3">
          {/* Left text */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">
              YOUR SECURITY IS OUR PRIORITY
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Bank-Level Security You Can Trust
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              We employ the same security standards used by leading global financial institutions to
              protect your investments and personal data at every step.
            </p>
            <Link
              href="/legal#compliance"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0052ff] hover:underline"
            >
              Learn More About Security
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Center icons */}
          <div className="flex flex-wrap justify-center gap-4">
            {securityFeatures.map(({ icon: Icon, label }) => (
              <div key={label} className="flex w-28 flex-col items-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                  <Icon className="h-5 w-5 text-[#0052ff]" />
                </div>
                <span className="text-[10px] font-medium leading-tight text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Right featured card */}
          <div className="rounded-2xl bg-[#0f1f4d] p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#0052ff]/20">
              <ShieldCheck className="h-10 w-10 text-[#0052ff]" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Funds, Fully Protected</h3>
            <p className="mt-3 text-sm leading-relaxed text-blue-200/80">
              Every transaction is encrypted, verified, and monitored in real time. We never
              compromise on the safety of your hard-earned money.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
