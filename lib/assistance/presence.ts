export type PresenceStatus = 'online' | 'away' | 'offline'

export type PresenceParticipantRole = 'user' | 'agent'

export type PresenceState = {
  participantId: string
  role: PresenceParticipantRole
  status: PresenceStatus
  joinedAt?: string
  displayName?: string
}

export type TypingState = {
  participantId: string
  role: PresenceParticipantRole
  isTyping: boolean
}

export const PRESENCE_CHANNEL_PREFIX = 'assistance-presence'
export const TYPING_INACTIVITY_MS = 3000
export const PRESENCE_HEARTBEAT_MS = 15000
export const AWAY_THRESHOLD_MS = 45000

export function presenceChannelName(sessionId: string) {
  return `${PRESENCE_CHANNEL_PREFIX}:${sessionId}`
}
