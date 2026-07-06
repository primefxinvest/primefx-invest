'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  Headphones,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ChatTypingIndicator } from '@/components/chat/ChatTypingIndicator'
import { TypewriterText } from '@/components/chat/TypewriterText'
import type { AssistanceChatState } from '@/lib/hooks/useAssistanceChat'
import { useTypewriter } from '@/lib/hooks/useTypewriter'
import { useSessionUser } from '@/lib/hooks/useSessionUser'
import { cn } from '@/lib/utils'

function formatTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function MessageTimestamp({ index, total }: { index: number; total: number }) {
  const [time, setTime] = useState('')
  useEffect(() => {
    setTime(formatTime(new Date(Date.now() - (total - index) * 60_000)))
  }, [index, total])
  return (
    <span className="flex items-center gap-1 px-1 text-[10px] tabular-nums text-muted-foreground">
      {time}
      <CheckCheck className="h-3 w-3 text-primary/60" aria-hidden />
    </span>
  )
}

type AssistanceMessagesTabProps = {
  chat: AssistanceChatState
}

export function AssistanceMessagesTab({ chat }: AssistanceMessagesTabProps) {
  const t = useTranslations('assistance')
  const user = useSessionUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    sessionLoading,
    messages,
    input,
    setInput,
    isLoading,
    userMessageCount,
    escalationSuggested,
    escalationReason,
    escalationSummary,
    escalating,
    uploading,
    pendingAttachments,
    clientError,
    session: sessionData,
    humanConnected,
    welcomeText,
    hasConversationHistory,
    submitMessage,
    handleEscalate,
    handleResolve,
    handleFileSelect,
    setEscalationSuggested,
    setEscalationReason,
  } = chat

  const showIntro = !hasConversationHistory && userMessageCount === 0 && !sessionLoading
  const intro = useTypewriter(welcomeText, {
    enabled: showIntro,
    startDelay: 800,
    speed: 16,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, escalationSuggested, intro.displayed])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        className="primefx-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
      >
        {sessionLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {showIntro && intro.isDelaying ? (
              <ChatTypingIndicator label={t('typing')} compact />
            ) : null}

            {showIntro && !intro.isDelaying && intro.displayed ? (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0052ff] to-[#2563eb] shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
                </div>
                <div className="flex max-w-[82%] flex-col gap-0.5">
                  <div className="rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed shadow-sm">
                    <TypewriterText text={intro.displayed} isTyping={intro.isTyping} />
                  </div>
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => {
              const isUser = message.role === 'user'
              const isAgent = message.role === 'agent'
              const isSystem = message.role === 'system'
              const text = message.text
              if (!text) return null

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center px-2">
                    <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-center text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {text}
                    </p>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
                >
                  {isUser ? (
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                      {user.avatar ? (
                        <Image src={user.avatar} alt="" fill className="object-cover" sizes="32px" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[10px] font-bold text-primary">
                          {(user.name ?? 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm',
                        isAgent
                          ? 'bg-gradient-to-br from-violet-600 to-indigo-600'
                          : 'bg-gradient-to-br from-[#0052ff] to-[#2563eb]'
                      )}
                    >
                      {isAgent ? (
                        <Headphones className="h-3.5 w-3.5 text-white" aria-hidden />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-white" aria-hidden />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      'flex max-w-[82%] flex-col gap-0.5',
                      isUser ? 'items-end' : 'items-start'
                    )}
                  >
                    {isAgent ? (
                      <span className="px-1 text-[10px] font-semibold text-violet-600">
                        {t('humanTitle')}
                      </span>
                    ) : null}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                        isUser
                          ? 'rounded-tr-md bg-primary text-primary-foreground'
                          : isAgent
                            ? 'rounded-tl-md border border-violet-200 bg-violet-50 text-foreground dark:border-violet-900 dark:bg-violet-950/30'
                            : 'rounded-tl-md border border-border bg-card text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{text}</p>
                      {message.role === 'assistant' &&
                      index === messages.length - 1 &&
                      isLoading ? (
                        <span
                          className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <MessageTimestamp index={index} total={messages.length} />
                  </div>
                </div>
              )
            })}

            {isLoading && !intro.isDelaying ? (
              <ChatTypingIndicator label={t('typing')} compact />
            ) : null}

            {escalationSuggested && sessionData?.status !== 'escalated' ? (
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  {t('escalation.title')}
                </p>
                {escalationSummary ? (
                  <dl className="mt-2 space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                    <div>
                      <dt className="inline font-medium">{t('escalation.issue')}: </dt>
                      <dd className="inline">{escalationSummary.issue}</dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">KYC: </dt>
                      <dd className="inline">{escalationSummary.kycStatus}</dd>
                    </div>
                    {escalationSummary.amount ? (
                      <div>
                        <dt className="inline font-medium">{t('escalation.amount')}: </dt>
                        <dd className="inline">{escalationSummary.amount}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="inline font-medium">{t('escalation.reason')}: </dt>
                      <dd className="inline">{escalationReason}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-300">
                    {escalationReason}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={escalating}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0052ff] to-[#2563eb] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {escalating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Headphones className="h-3.5 w-3.5" />
                  )}
                  {t('escalation.connect')}
                </button>
              </div>
            ) : null}

            {sessionData?.status === 'escalated' && humanConnected && !chat.hasAgentReply ? (
              <div className="rounded-xl border border-border bg-muted/40 p-3 text-center">
                <div className="mx-auto mb-2 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <p className="text-xs font-medium text-foreground">{t('escalation.waiting')}</p>
                </div>
                {sessionData.ticketNumber ? (
                  <p className="font-mono text-[11px] font-medium text-muted-foreground">
                    {t('ticketLabel')} {sessionData.ticketNumber}
                  </p>
                ) : null}
              </div>
            ) : null}

            {clientError ? (
              <p className="text-center text-xs text-destructive" role="alert">
                {clientError}
              </p>
            ) : null}

            <div ref={messagesEndRef} aria-hidden="true" />
          </>
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card p-3">
        {pendingAttachments.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {pendingAttachments.map((att) => (
              <span
                key={att.path}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px]"
              >
                <Check className="h-3 w-3 text-emerald-600" />
                {att.name}
              </span>
            ))}
          </div>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void submitMessage(input)
          }}
          className="flex items-end gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleFileSelect(file)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label={t('attach')}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submitMessage(input)
              }
            }}
            placeholder={t('inputPlaceholder')}
            rows={1}
            disabled={sessionLoading}
            className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || sessionLoading}
            className="shrink-0 rounded-xl bg-gradient-to-r from-[#0052ff] to-[#2563eb] p-2.5 text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
            aria-label={t('send')}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

        {userMessageCount > 0 && sessionData?.status !== 'escalated' ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setEscalationSuggested(true)
                setEscalationReason(t('escalation.userRequested'))
              }}
              className="text-[10px] font-medium text-primary hover:underline"
            >
              {t('escalation.connect')}
            </button>
            <button
              type="button"
              onClick={handleResolve}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              {t('markResolved')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
