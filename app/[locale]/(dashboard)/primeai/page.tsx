'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2, Settings, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { getMessageText, PRIMEAI_WELCOME_MESSAGE } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'

function PrimeAIChat() {
  const t = useTranslations('primeaiChat')
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const initialQuerySent = useRef(false)

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: [PRIMEAI_WELCOME_MESSAGE],
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const clientError = useMemo(() => {
    if (!error) return null
    const sanitized = toPrimeAiClientError(error.message)
    return sanitized === PRIMEAI_UNAVAILABLE_USER_MESSAGE
      ? t('unavailableMessage')
      : t('requestFailed')
  }, [error, t])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const query = searchParams.get('q')
    if (!query || initialQuerySent.current) return
    initialQuerySent.current = true
    sendMessage({ text: query })
  }, [searchParams, sendMessage])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return
    clearError()
    sendMessage({ text })
    setInput('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">PrimeAI Assistant</h2>
              <p className="text-xs text-emerald-600">
                {isLoading ? 'Thinking...' : 'Online · Powered by Google Gemini'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info('Voice chat', { description: 'Voice mode coming soon.' })}
              className="rounded-lg border border-border p-2 hover:bg-secondary transition-colors"
            >
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => toast.info('Settings', { description: 'Chat preferences coming soon.' })}
              className="rounded-lg border border-border p-2 hover:bg-secondary transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-[12rem] flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4 sm:min-h-[20rem]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 sm:max-w-lg ${
                message.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-secondary text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{getMessageText(message)}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">PrimeAI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about investments, market trends, portfolio advice..."
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-3 outline-none transition-colors focus:border-primary"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>

      {clientError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">{t('unavailableTitle')}</p>
          <p className="mt-1 text-sm text-amber-800">{clientError}</p>
        </div>
      ) : null}

      <div className="text-center text-xs text-muted-foreground">
        <p>
          PrimeAI is powered by Google Gemini with live investment plan data from your platform.
          Always verify recommendations independently.
        </p>
      </div>
    </div>
  )
}

export default function PrimeAIPage() {
  return (
    <div className="flex min-h-[calc(100dvh-10rem-env(safe-area-inset-top))] flex-col">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
            Loading PrimeAI...
          </div>
        }
      >
        <PrimeAIChat />
      </Suspense>
    </div>
  )
}
