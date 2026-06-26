'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { LANDING_FAQS } from '@/lib/seo/faqs'

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
  const leftFaqs = LANDING_FAQS.slice(0, 4)
  const rightFaqs = LANDING_FAQS.slice(4)

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
                <FAQItem key={faq.question} q={faq.question} a={faq.answer} />
              ))}
          </div>

          <div>
              {rightFaqs.map((faq) => (
                <FAQItem key={faq.question} q={faq.question} a={faq.answer} />
              ))}
          </div>
        </div>
      </div>
    </section>
  )
}
