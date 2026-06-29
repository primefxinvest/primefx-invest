'use client'

import { Link } from '@/i18n/navigation'
import { useRouter } from '@/i18n/navigation'
import { useState } from 'react'
import { Bot, Mic, Send, Sparkles } from 'lucide-react'

const defaultSuggestions = [
  'Analyze my portfolio',
  'Best investment for me',
  'Market outlook today',
  'Explain investment terms',
]

interface InvestPrimeAIWidgetProps {
  suggestions?: string[]
}

export default function InvestPrimeAIWidget({
  suggestions = defaultSuggestions,
}: InvestPrimeAIWidgetProps) {
  const router = useRouter()
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
          <h3 className="text-sm font-bold text-gray-900">PrimeAI Assistant</h3>
          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#0052ff]">
            Beta
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl bg-gray-50 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0052ff]/10">
          <Bot className="h-5 w-5 text-[#0052ff]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-900">Hello John!</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            How can I help you today?
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => openChat(s)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs text-gray-600 transition-colors hover:border-[#0052ff] hover:text-[#0052ff]"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask PrimeAI anything..."
          className="flex-1 bg-transparent text-xs text-gray-900 outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0052ff] text-white"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      <button
        type="button"
        onClick={() => openChat()}
        className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs font-semibold text-[#0052ff] hover:underline"
      >
        <Mic className="h-3.5 w-3.5" />
        Voice Chat
      </button>

      <Link
        href="/primeai"
        className="mt-2 block text-center text-xs font-semibold text-gray-400 hover:text-[#0052ff]"
      >
        Open Full Chat →
      </Link>
    </div>
  )
}
