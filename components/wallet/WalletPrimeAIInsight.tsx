'use client'

import Link from 'next/link'
import { ArrowRight, Bot, Sparkles } from 'lucide-react'

export default function WalletPrimeAIInsight() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-bold text-gray-900">PrimeAI Wallet Insight</h2>
        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0052ff]">
          Beta
        </span>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052ff]/10">
            <Bot className="h-5 w-5 text-[#0052ff]" />
          </div>
          <p className="text-xs leading-relaxed text-gray-600">
            Your wallet is well managed! Keep investing consistently to grow your wealth.
          </p>
        </div>

        <Link
          href="/primeai?q=Analyze%20my%20wallet%20and%20suggest%20optimizations"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0052ff] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <Sparkles className="h-4 w-4" />
          Ask PrimeAI
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
