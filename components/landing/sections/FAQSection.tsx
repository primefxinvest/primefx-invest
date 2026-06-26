'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'Is PrimeAI Invest safe and secure?',
    a: 'Yes. We use 256-bit SSL encryption, cold storage wallets, two-factor authentication, and are fully compliant with global financial regulations.',
  },
  {
    q: 'What is the minimum investment amount?',
    a: 'You can start with as little as $50 on our Starter Plan. Higher-tier plans have higher minimums but offer greater return potential.',
  },
  {
    q: 'How often can I withdraw my profits?',
    a: 'Withdrawals are processed every 7 days on all plans. You can also access your capital anytime with no lock-in periods.',
  },
  {
    q: 'How does the AI investment system work?',
    a: 'Our proprietary AI analyzes thousands of market signals in real time and executes trades through our expert management team to optimize your portfolio.',
  },
  {
    q: 'What returns can I realistically expect?',
    a: 'Returns vary by plan and market conditions. Our Starter Plan targets 8–15% monthly ROI, while Elite plans can reach 40–60%. Past performance does not guarantee future results.',
  },
  {
    q: 'Do I need investment experience to get started?',
    a: 'Not at all. PrimeFx Invest is designed for everyone — from complete beginners to seasoned investors. Our platform handles everything for you.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept bank transfers, credit/debit cards, and major cryptocurrencies including Bitcoin and Ethereum.',
  },
  {
    q: 'Is there a mobile app available?',
    a: 'Yes! Our mobile app is available on both iOS and Android, giving you full access to your portfolio, deposits, withdrawals, and support on the go.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        {open ? (
          <Minus className="h-4 w-4 shrink-0 text-[#0052ff]" />
        ) : (
          <Plus className="h-4 w-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-gray-600">{a}</p>}
    </div>
  )
}

export default function FAQSection() {
  const leftFaqs = faqs.slice(0, 4)
  const rightFaqs = faqs.slice(4)

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold tracking-widest text-[#0052ff]">FAQ</p>
            <h2 className="mt-3 text-3xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              Everything you need to know before getting started.
            </p>
          </div>

          <div>
            {leftFaqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>

          <div>
            {rightFaqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
