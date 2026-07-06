import type { AssistanceMessage, AssistanceMessageMeta } from '@/lib/assistance/types'

export type DeliveryStatus = 'sending' | 'sent' | 'delivered' | 'read'

export function resolveDeliveryStatus(
  metadata: AssistanceMessageMeta | undefined,
  opts?: { optimistic?: boolean }
): DeliveryStatus {
  if (opts?.optimistic) return 'sending'
  if (metadata?.readAt) return 'read'
  if (metadata?.deliveredAt) return 'delivered'
  if (metadata?.sentAt) return 'sent'
  return 'sent'
}

export function sortMessagesByCreatedAt<T extends { createdAt?: string; id: string }>(
  messages: T[]
): T[] {
  return [...messages].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    if (ta !== tb) return ta - tb
    return a.id.localeCompare(b.id)
  })
}

export function dedupeMessages<T extends { id: string }>(messages: T[]): T[] {
  const seen = new Set<string>()
  return messages.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })
}

export function mergeAssistanceMessages(
  existing: AssistanceMessage[],
  incoming: AssistanceMessage[]
): AssistanceMessage[] {
  const map = new Map<string, AssistanceMessage>()
  for (const m of existing) map.set(m.id, m)
  for (const m of incoming) {
    const prev = map.get(m.id)
    if (!prev) {
      map.set(m.id, m)
      continue
    }
    map.set(m.id, {
      ...prev,
      ...m,
      metadata: { ...prev.metadata, ...m.metadata },
    })
  }
  return sortMessagesByCreatedAt(dedupeMessages(Array.from(map.values())))
}

export function replaceOptimisticMessage<T extends { id: string; text?: string; content?: string }>(
  messages: T[],
  optimisticId: string,
  persisted: T
): T[] {
  const idx = messages.findIndex((m) => m.id === optimisticId)
  if (idx === -1) {
    if (messages.some((m) => m.id === persisted.id)) return messages
    return sortMessagesByCreatedAt([...messages, persisted])
  }
  const next = [...messages]
  next[idx] = persisted
  return dedupeMessages(next)
}
