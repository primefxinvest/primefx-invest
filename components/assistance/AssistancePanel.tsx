'use client'

import { useEffect, useState } from 'react'
import { AssistanceHeader } from '@/components/assistance/AssistanceHeader'
import { AssistanceHelpTab } from '@/components/assistance/AssistanceHelpTab'
import { AssistanceHomeTab } from '@/components/assistance/AssistanceHomeTab'
import { AssistanceMessagesTab } from '@/components/assistance/AssistanceMessagesTab'
import { AssistanceTabBar, type AssistanceTab } from '@/components/assistance/AssistanceTabBar'
import { useAssistanceChat } from '@/lib/hooks/useAssistanceChat'

type AssistancePanelProps = {
  onClose: () => void
  onMinimize: () => void
  initialTab?: AssistanceTab
  initialHelpSearch?: string
}

export function AssistancePanel({
  onClose,
  onMinimize,
  initialTab,
  initialHelpSearch,
}: AssistancePanelProps) {
  const [activeTab, setActiveTab] = useState<AssistanceTab>(initialTab ?? 'home')
  const [helpSearch, setHelpSearch] = useState(initialHelpSearch ?? '')
  const chat = useAssistanceChat()

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    if (initialHelpSearch !== undefined) setHelpSearch(initialHelpSearch)
  }, [initialHelpSearch])

  const hasActiveConversation = chat.userMessageCount > 0 || chat.session?.status === 'escalated'

  const handleAskAi = (query: string) => {
    chat.startChat(query)
    setActiveTab('messages')
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <AssistanceHeader
        isHumanMode={chat.isHumanMode}
        session={chat.session}
        agentJoined={chat.agentJoined}
        agentPresence={chat.agentPresence}
        showBack={activeTab !== 'home'}
        onBack={() => setActiveTab('home')}
        onMinimize={onMinimize}
        onClose={onClose}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {activeTab === 'home' ? (
          <AssistanceHomeTab
            onStartChat={(query) => {
              if (query) chat.startChat(query)
              setActiveTab('messages')
            }}
            onGoToMessages={() => setActiveTab('messages')}
            onGoToHelp={(search) => {
              if (search) setHelpSearch(search)
              setActiveTab('help')
            }}
            hasActiveConversation={hasActiveConversation}
          />
        ) : null}

        {activeTab === 'messages' ? <AssistanceMessagesTab chat={chat} /> : null}

        {activeTab === 'help' ? (
          <AssistanceHelpTab initialSearch={helpSearch} onAskAi={handleAskAi} />
        ) : null}
      </div>

      <AssistanceTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        messageBadge={hasActiveConversation && activeTab !== 'messages'}
      />
    </div>
  )
}
