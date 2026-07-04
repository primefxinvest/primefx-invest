'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, Loader2 } from 'lucide-react'
import { getMessageText, PRIMEAI_WELCOME_MESSAGE } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { cn } from '@/lib/utils'

const SUGGESTED_PROMPTS = [
  'What investment plans are available?',
  'Explain my portfolio allocation',
  "Give me today's market outlook",
]

function TypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-live="polite" aria-label="PrimeAI is typing">
      <div className="flex items-center gap-3 rounded-xl bg-secondary px-4 py-3">
        <div className="flex items-center gap-1" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
        </div>
        <span className="text-sm text-muted-foreground">PrimeAI is thinking...</span>
      </div>
    </div>
  )
}

function PrimeAIChat() {
  const t = useTranslations('primeaiChat')
  const searchParams = useSearchParams()
  const [input, setInput] = useState('')
  const initialQuerySent = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
    messages: [PRIMEAI_WELCOME_MESSAGE],
  })

  const isLoading = status === 'submitted' || status === 'streaming'
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const showSuggestions = messages.length <= 1 && !isLoading

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

  const submitMessage = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    clearError()
    sendMessage({ text: trimmed })
    setInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage(input)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setInput('')
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage(input)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <header className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10"
              aria-hidden="true"
            >
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground sm:text-xl">PrimeAI Assistant</h1>
              <p className="text-xs text-emerald-600">
                {isLoading ? 'Thinking...' : 'Online · Powered by Google Gemini'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div
        ref={messagesContainerRef}
        className="min-h-[12rem] flex-1 space-y-3 overflow-y-auto rounded-xl border border-border bg-card p-4 sm:min-h-[20rem] sm:space-y-4 sm:p-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[10rem] flex-col items-center justify-center text-center">
            <p className="text-sm font-medium text-foreground">Start a conversation with PrimeAI</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Ask about investments, market trends, or portfolio guidance.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-xl px-4 py-3 sm:max-w-lg',
                  message.role === 'user'
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-foreground'
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{getMessageText(message)}</p>
              </div>
            </div>
          ))
        )}

        {isLoading ? <TypingIndicator /> : null}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {showSuggestions ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested prompts">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => submitMessage(prompt)}
              disabled={isLoading}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 flex flex-col gap-2 border-t border-border bg-background pt-2 sm:flex-row"
        aria-label="Send a message to PrimeAI"
      >
        <label htmlFor="primeai-input" className="sr-only">
          Message PrimeAI
        </label>
        <input
          id="primeai-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Ask about investments, market trends, portfolio advice..."
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          disabled={isLoading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sm:hidden">Send</span>
        </button>
      </form>

      {clientError ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
          role="alert"
        >
          <p className="text-sm font-medium text-amber-900">{t('unavailableTitle')}</p>
          <p className="mt-1 text-sm text-amber-800">{clientError}</p>
        </div>
      ) : null}

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        PrimeAI is powered by Google Gemini with live investment plan data from your platform.
        Always verify recommendations independently.
      </p>
    </div>
  )
}

export default function PrimeAIPage() {
  return (
    <div className="flex min-h-[calc(100dvh-10rem-env(safe-area-inset-top))] flex-col">
      <Suspense
        fallback={
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading PrimeAI...</p>
          </div>
        }
      >
        <PrimeAIChat />
      </Suspense>
    </div>
  )
}
