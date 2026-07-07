'use client'

import { memo } from 'react'
import { Check } from 'lucide-react'

const MARQUEE_ITEMS = [
  'Global Access',
  'Secure Platform',
  'Identity Verification',
  'Weekly Profit Distribution',
  '24/7 Support',
  'PrimeAI Assistance',
  'Start Investing',
  'Trusted Worldwide',
  'AI Investment',
  'Real-Time Portfolio',
  'Fast Deposits',
  'Instant Withdrawals',
  'Smart Investment Plans',
  'Professional Investors',
  'Institutional Security',
  'Multi-Currency Support',
  'Bank-Level Protection',
  'Secure Wallet',
  'AI Market Analysis',
  'Crypto Investments',
  'Forex Investments',
  'Gold Investments',
  'Transparent Returns',
  'Daily Portfolio Updates',
  'Verified Accounts',
  'Protected Assets',
  'Risk Management',
  'Financial Freedom',
] as const

const MarqueeStrip = memo(function MarqueeStrip({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 items-center gap-8 px-4 sm:gap-10 sm:px-5"
      aria-hidden={ariaHidden || undefined}
    >
      {MARQUEE_ITEMS.map((label) => (
        <span
          key={`${ariaHidden ? 'dup-' : ''}${label}`}
          className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium text-gray-800"
        >
          <Check className="h-3.5 w-3.5 shrink-0 text-[#0052ff]" strokeWidth={2.5} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  )
})

function HeroMarquee() {
  return (
    <div className="hero-marquee-root relative border-y border-gray-200/80 bg-white">
      <style>{`
        @keyframes hero-marquee-scroll {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .hero-marquee-track {
          display: flex;
          width: max-content;
          animation: hero-marquee-scroll 85s linear infinite;
          will-change: transform;
        }
        .hero-marquee-root:hover .hero-marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-marquee-track {
            animation: none;
          }
        }
      `}</style>

      <div className="overflow-hidden">
        <div className="hero-marquee-track h-[60px] items-center">
          <MarqueeStrip />
          <MarqueeStrip ariaHidden />
        </div>
      </div>
    </div>
  )
}

export default memo(HeroMarquee)
