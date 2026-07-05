'use client'

import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { useSessionUser } from '@/lib/hooks/useSessionUser'

const suggestionKeys = [
  'analyzePortfolio',
  'bestInvestment',
  'marketOutlook',
  'explainTerms',
] as const

export default function InvestPrimeAIWidget() {
  const t = useTranslations('invest.primeAiWidget')
  const router = useRouter()
  const user = useSessionUser()
  const [query, setQuery] = useState('')

  const openChat = (message?: string) => {
    const url = message
      ? `/primeai?q=${encodeURIComponent(message)}`
      : '/primeai'
    router.push(url)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      openChat(query.trim())
      setQuery('')
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0052ff]">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">{t('title')}</h3>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0052ff]">
            {t('beta')}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052ff]/10">
          <Bot className="h-5 w-5 text-[#0052ff]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">
            {user.name && user.name !== 'Guest' ? user.name : 'PrimeAI'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{t('greeting')}</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {suggestionKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => openChat(t(`suggestions.${key}`))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:border-[#0052ff] hover:text-[#0052ff]"
          >
            {t(`suggestions.${key}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="flex-1 bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0052ff] text-white"
          aria-label={t('send')}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <Link
        href="/primeai"
        className="mt-2 block text-center text-xs font-semibold text-gray-400 hover:text-[#0052ff]"
      >
        {t('openChat')}
      </Link>
    </div>
  )
}
