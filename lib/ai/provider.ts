import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export type AiProviderName = 'gemini' | 'openai'

const DEFAULT_GEMINI_CHAT_MODEL = 'gemini-flash-latest'
const DEFAULT_GEMINI_VISION_MODEL = 'gemini-flash-latest'

export function getGeminiApiKey(): string | undefined {
  return (
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim() ||
    undefined
  )
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY?.trim() || undefined
}

export function getGeminiChatModelId(): string {
  return process.env.GEMINI_CHAT_MODEL?.trim() || DEFAULT_GEMINI_CHAT_MODEL
}

function createGeminiProvider() {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    console.warn('[PrimeAI] Gemini API key missing — set GEMINI_API_KEY or GOOGLE_API_KEY')
    return null
  }
  return createGoogleGenerativeAI({ apiKey })
}

/** PrimeAI chat — Google Gemini only. */
export function getChatModel(): LanguageModel | null {
  const gemini = createGeminiProvider()
  if (!gemini) return null
  return gemini(getGeminiChatModelId())
}

/** Document vision — prefers Gemini; OpenAI optional fallback for KYC only. */
export function getVisionModel(): LanguageModel | null {
  const gemini = createGeminiProvider()
  if (gemini) {
    const modelId = process.env.GEMINI_VISION_MODEL?.trim() || DEFAULT_GEMINI_VISION_MODEL
    return gemini(modelId)
  }
  const openaiKey = getOpenAiApiKey()
  if (openaiKey) return openai('gpt-4o-mini')
  return null
}

export function getPrimeAiConfigError(): string {
  return 'PrimeAI requires GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey'
}

/** Safe message for API responses and UI — never mentions env vars. */
export function getPrimeAiUnavailableUserMessage(): string {
  return 'PrimeAI is currently unavailable. Please try again in a few moments.'
}

export function logPrimeAiConfig() {
  console.log('Gemini API Key exists:', Boolean(getGeminiApiKey()))
  console.log('Gemini model:', getGeminiChatModelId())
}

export function getAiConfigError(): string {
  return 'AI is not configured. Add GEMINI_API_KEY (https://aistudio.google.com/apikey) or OPENAI_API_KEY for KYC document scanning.'
}

export function isPrimeAiConfigured(): boolean {
  return Boolean(getGeminiApiKey())
}

export function getActiveAiProvider(): AiProviderName | null {
  if (getGeminiApiKey()) return 'gemini'
  if (getOpenAiApiKey()) return 'openai'
  return null
}

export function getActiveAiProviderLabel(): string {
  return 'Google Gemini'
}
