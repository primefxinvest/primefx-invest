'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useChat } from '@ai-sdk/react'
import {
  Loader2,
  Mic,
  Paperclip,
  Send,
  Sparkles,
} from 'lucide-react'
import { PRIMEAI_CAPABILITIES, PRIMEAI_QUICK_ACTIONS } from '@/components/primeai/constants'
import { PrimeAIQuickActionsGrid } from '@/components/primeai/PrimeAIQuickActionsGrid'
import { createPrimeAIWelcomeMessage, getMessageText } from '@/lib/ai/message-utils'
import { toPrimeAiClientError, PRIMEAI_UNAVAILABLE_USER_MESSAGE } from '@/lib/ai/user-errors'
import { useLocaleChatTransport } from '@/lib/hooks/useLocaleChatTransport'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { cn } from '@/lib/utils'

function formatMessageTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

/** Client-only timestamp avoids hydration mismatch from Date.now() during render. */
function MessageTimestamp({ index, total }: { index: number; total: number }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    setTime(formatMessageTime(new Date(Date.now() - (total - index) * 60_000)))
  }, [index, total])

  return (
    <span className="px-1 text-[10px] tabular-nums text-muted-foreground" suppressHydrationWarning>
      {time}
    </span>
  )
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex justify-start gap-3" role="status" aria-live="polite">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-sm">
        <Sparkles className="h-4 w-4 text-white" aria-hidden />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-border bg-card px-4 py-3 shadow-sm sm:max-w-lg">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-2 flex items-center gap-1" aria-hidden="true">
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

function MessageBubble({
  role,
  text,
  userAvatar,
  userName,
  messageIndex,
  messageTotal,
}: {
  role: 'user' | 'assistant'
  text: string
  userAvatar?: string
  userName?: string
  messageIndex: number
  messageTotal: number
}) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {isUser ? (
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {userAvatar ? (
            <Image src={userAvatar} alt="" fill className="object-cover" sizes="36px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-primary">
              {(userName ?? 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-sm">
          <Sparkles className="h-4 w-4 text-white" aria-hidden />
        </div>
      )}

      <div className={cn('flex max-w-[85%] flex-col gap-1 sm:max-w-xl', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm',
            isUser
              ? 'rounded-tr-md bg-primary text-primary-foreground'
              : 'rounded-tl-md border border-border bg-card text-foreground'
          )}
        >
          {/* Markdown-ready wrapper — swap inner renderer when streaming markdown is enabled */}
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
        </div>
        <MessageTimestamp index={messageIndex} total={messageTotal} />
      </div>
    </div>
  )
}

function PrimeAIChatInner() {
  const locale = useLocale()
  const t = useTranslations('primeaiPage')
  const tErrors = useTranslations('primeaiChat')
  const searchParams = useSearchParams()
  const user = useSessionUser()
  const [input, setInput] = useState('')
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [loadingPhase, setLoadingPhase] = useState<'connecting' | 'analyzing' | 'generating'>('connecting')
  const initialQuerySent = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const transport = useLocaleChatTransport()
  const welcomeMessage = useMemo(
    () => createPrimeAIWelcomeMessage(t('welcomeMessage')),
    [t, locale]
  )

  const { messages, sendMessage, status, error, clearError, setMessages } = useChat({
    transport,
    messages: [welcomeMessage],
  })

  useEffect(() => {
    setMessages([welcomeMessage])
    initialQuerySent.current = false
  }, [locale, welcomeMessage, setMessages])

  const isLoading = status === 'submitted' || status === 'streaming'
  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const showQuickActions = userMessageCount === 0 && !isLoading

  const quickActions = useMemo(
    () =>
      PRIMEAI_QUICK_ACTIONS.map(({ key, icon }) => ({
        key,
        icon,
        title: t(`actions.${key}.title`),
        query: t(`actions.${key}.query`),
      })),
    [t]
  )

  const typingLabel = useMemo(() => {
    if (loadingPhase === 'connecting') return t('loadingConnecting')
    if (loadingPhase === 'analyzing') return t('loadingAnalyzing')
    return t('loadingGenerating')
  }, [loadingPhase, t])

  useEffect(() => {
    if (status === 'submitted') {
      setLoadingPhase('connecting')
      return
    }

    if (status === 'streaming') {
      setLoadingPhase('analyzing')
      const timer = window.setTimeout(() => setLoadingPhase('generating'), 1800)
      return () => window.clearTimeout(timer)
    }
  }, [status])

  const clientError = useMemo(() => {
    if (!error) return null
    const sanitized = toPrimeAiClientError(error.message)
    return sanitized === PRIMEAI_UNAVAILABLE_USER_MESSAGE
      ? tErrors('unavailableMessage')
      : tErrors('requestFailed')
  }, [error, tErrors])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    const query = searchParams.get('q')
    if (!query || initialQuerySent.current) return
    initialQuerySent.current = true
    sendMessage({ text: query })
  }, [searchParams, sendMessage])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [input])

  const submitMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return
      clearError()
      setPendingAction(null)
      sendMessage({ text: trimmed })
      setInput('')
    },
    [clearError, isLoading, sendMessage]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitMessage(input)
    }
  }

  const handleQuickAction = (query: string, key: string) => {
    setPendingAction(key)
    submitMessage(query)
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Header */}
      <header className="shrink-0">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-md shadow-[#0052ff]/20 sm:h-11 sm:w-11">
            <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl lg:text-2xl">
                {t('title')}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {isLoading ? t('statusThinking') : t('statusOnline')}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{t('subtitle')}</p>
          </div>
        </div>

        {/* Capability chips */}
        <div className="primefx-scrollbar mt-3 flex gap-1.5 overflow-x-auto pb-0.5 sm:mt-3.5 sm:gap-2 lg:flex-wrap lg:overflow-visible">
          {PRIMEAI_CAPABILITIES.map(({ key, icon: Icon }) => (
            <span
              key={key}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Icon className="h-3 w-3 text-primary sm:h-3.5 sm:w-3.5" aria-hidden />
              {t(`capabilities.${key}`)}
            </span>
          ))}
        </div>
      </header>

      {/* Chat workspace */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm sm:mt-4 sm:rounded-2xl">
        <div
          className="primefx-scrollbar min-h-[220px] flex-1 space-y-4 overflow-y-auto p-3 sm:min-h-[280px] sm:space-y-5 sm:p-4 lg:min-h-[320px] lg:p-5"
          role="log"
          aria-live="polite"
          aria-label={t('chatLabel')}
        >
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              role={message.role === 'user' ? 'user' : 'assistant'}
              text={getMessageText(message)}
              userAvatar={user.avatar}
              userName={user.name}
              messageIndex={index}
              messageTotal={messages.length}
            />
          ))}

          {isLoading ? <TypingIndicator label={typingLabel} /> : null}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>

        {/* Quick action cards */}
        {showQuickActions ? (
          <div className="border-t border-border bg-muted/20 px-2.5 py-2.5 sm:px-3 sm:py-3 lg:px-4">
            <PrimeAIQuickActionsGrid
              actions={quickActions}
              pendingKey={pendingAction}
              isLoading={isLoading}
              onAction={handleQuickAction}
            />
          </div>
        ) : null}

        {/* Sticky input */}
        <div className="shrink-0 border-t border-border bg-card p-2.5 sm:p-3 lg:p-4">
          {clientError ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2" role="alert">
              <p className="text-xs font-semibold text-amber-900">{tErrors('unavailableTitle')}</p>
              <p className="mt-0.5 text-xs text-amber-800">{clientError}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2" aria-label={t('inputLabel')}>
            <div className="flex shrink-0 items-center gap-1 pb-2">
              <button
                type="button"
                disabled
                aria-label={t('attachLabel')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground opacity-50"
              >
                <Paperclip className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled
                aria-label={t('micLabel')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground opacity-50"
              >
                <Mic className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <label htmlFor="primeai-input" className="sr-only">
              {t('inputLabel')}
            </label>
            <textarea
              id="primeai-input"
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('inputPlaceholder')}
              disabled={isLoading}
              className="max-h-40 min-h-[40px] min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:min-h-[44px] sm:px-4 sm:py-3"
            />

            <button
              type="submit"
              disabled={isLoading || input.trim().length === 0}
              aria-label={isLoading ? t('sending') : t('send')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
            </button>
          </form>
        </div>
      </div>

      <p className="mt-2 shrink-0 text-center text-[10px] leading-relaxed text-muted-foreground sm:mt-3 sm:text-[11px]">
        {t('disclaimer')}
      </p>
    </div>
  )
}

function PrimeAIChatFallback() {
  const t = useTranslations('primeaiPage')
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-8"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{t('loading')}</p>
    </div>
  )
}

export function PrimeAIChatPage() {
  const locale = useLocale()
  return (
    <div className="flex min-h-[calc(100dvh-8rem-env(safe-area-inset-top,0px))] w-full flex-col pb-[env(safe-area-inset-bottom,0px)]">
      <Suspense fallback={<PrimeAIChatFallback />}>
        <PrimeAIChatInner key={locale} />
      </Suspense>
    </div>
  )
}
