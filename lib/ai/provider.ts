import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export type AiProviderName = 'gemini' | 'openai'

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    undefined
  )
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined
}

export function getActiveAiProvider(): AiProviderName | null {
  if (getGeminiApiKey()) return 'gemini'
  if (getOpenAiApiKey()) return 'openai'
  return null
}

export function getAiConfigError(): string {
  return 'AI is not configured. Add GEMINI_API_KEY (free at https://aistudio.google.com/apikey) or OPENAI_API_KEY.'
}

function createGeminiProvider() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) return null
  return createGoogleGenerativeAI({ apiKey })
}

export function getVisionModel(): LanguageModel | null {
  const gemini = createGeminiProvider()
  if (gemini) return gemini('gemini-2.0-flash')
  const openaiKey = getOpenAiApiKey()
  if (openaiKey) return openai('gpt-4o-mini')
  return null
}

export function getChatModel(): LanguageModel | null {
  const gemini = createGeminiProvider()
  if (gemini) return gemini('gemini-2.0-flash')
  const openaiKey = getOpenAiApiKey()
  if (openaiKey) return openai('gpt-4o-mini')
  return null
}

export function getActiveAiProviderLabel(): string {
  const provider = getActiveAiProvider()
  if (provider === 'gemini') return 'Google Gemini'
  if (provider === 'openai') return 'OpenAI'
  return 'Not configured'
}
