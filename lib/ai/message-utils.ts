import type { UIMessage } from 'ai'

export function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export function createPrimeAIWelcomeMessage(text: string): UIMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    parts: [{ type: 'text', text }],
  }
}
