'use client'

import { useState } from 'react'
import { ChevronDown, Headphones } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { FAQ_ITEMS } from '@/lib/how-primefx-works/content'
import { cn } from '@/lib/utils'
import { InfoCard, SectionHeader, SectionShell } from './shared'

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  const headingId = `faq-${question.replace(/\s+/g, '-').toLowerCase()}`
  const panelId = `${headingId}-panel`

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        id={headingId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-[#0052ff]"
      >
        <span className="text-sm font-semibold text-gray-900 sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-gray-400 transition-transform duration-200',
            isOpen && 'rotate-180 text-[#0052ff]'
          )}
          aria-hidden
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={headingId}
        hidden={!isOpen}
        className="pb-4"
      >
        <p className="text-sm leading-relaxed text-gray-600">{answer}</p>
      </div>
    </div>
  )
}

export function HowPrimefxFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <SectionShell id="faq" variant="muted">
      <SectionHeader
        eyebrow="Support"
        title="Frequently Asked Questions"
        subtitle="Clear answers to the most common questions from new and existing investors."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <InfoCard className="lg:col-span-2">
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </InfoCard>

        <InfoCard className="flex flex-col justify-between bg-gradient-to-br from-blue-50/80 via-white to-white">
          <div>
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#0052ff]">
              <Headphones className="size-6 text-white" aria-hidden />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Still have questions?</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Our support team and PrimeAI Assistance are available 24/7 to help with deposits,
              withdrawals, verification, and more.
            </p>
          </div>
          <Link
            href="/support"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#0052ff] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Contact Support
          </Link>
        </InfoCard>
      </div>
    </SectionShell>
  )
}
