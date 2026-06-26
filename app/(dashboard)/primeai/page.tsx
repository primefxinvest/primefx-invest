'use client'

import { useChat } from '@ai-sdk/react'
import { Send, Loader2, Settings, Volume2, VolumeX } from 'lucide-react'
import { useRef, useEffect } from 'react'

export default function PrimeAIPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Hello! I\'m PrimeAI, your personal investment assistant. I can help you analyze portfolios, discuss investment strategies, answer market questions, and provide personalized financial advice. How can I help you today?',
      },
    ],
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-4">
      {/* Chat Header */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">PrimeAI Assistant</h2>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Online - Ready to assist</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-border p-2 hover:bg-secondary transition-colors">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="rounded-lg border border-border p-2 hover:bg-secondary transition-colors">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-4xl">🤖</div>
              <p className="text-foreground font-semibold">No messages yet</p>
              <p className="text-sm text-muted-foreground">Start a conversation with PrimeAI</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-secondary px-4 py-3 rounded-lg">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">PrimeAI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about investments, market trends, portfolio advice..."
          className="flex-1 rounded-lg border border-border bg-background px-4 py-3 outline-none focus:border-primary transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || input.trim().length === 0}
          className="rounded-lg bg-primary px-4 py-3 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-4">
          <p className="text-sm text-red-700 dark:text-red-300">
            Error: {error.message}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="text-center text-xs text-muted-foreground">
        <p>PrimeAI uses advanced AI to provide investment insights. Always verify recommendations independently.</p>
      </div>
    </div>
  )
}
