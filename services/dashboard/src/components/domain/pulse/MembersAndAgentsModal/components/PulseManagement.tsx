import { Stack } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { useMarkDirectMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkDirectMessagesAsReadMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useAgentContext } from '~/context/AgentContext'
import { useOrganization } from '~/hooks/useOrganization'

import { useUnreadMemberMessages } from '../hooks'
import { AddAgentDetail } from './AddAgentDetail'
import { AgentDetail } from './AgentDetail'
import { AgentsTab } from './AgentsTab'
import AgentStore from './AgentStore'
import { ManageMembersView } from './ManageMembersView'
import { MembersTab } from './MembersTab'
import { TabHeader } from './TabHeader'

export enum TabType {
  MEMBERS = 0,
  AI_AGENTS = 1,
}

export enum ViewMode {
  TAB_VIEW = 'TAB_VIEW',
  AGENT_STORE = 'AGENT_STORE',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  AGENT_DETAIL = 'AGENT_DETAIL',
  ADD_AGENT = 'ADD_AGENT',
}

interface PulseManagementProps {
  members: User[]
  onMessageClick: (member: User) => void
}

export const PulseManagement = ({
  members,
  onMessageClick,
}: PulseManagementProps) => {
  const { user } = useAuthContext()
  const { threadId } = useParams()
  const { organizationId } = useOrganization()
  const { agentDetailId, setAddAgent, setAgentDetailId, setSelectedAgent } =
    useAgentContext()

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TAB_VIEW)
  const [tabIndex, setTabIndex] = useState<TabType>(TabType.MEMBERS)

  const { membersWithUnreads, handleMessageRead } = useUnreadMemberMessages({
    organizationId,
  })

  const { mutate: markDirectMessagesAsRead } =
    useMarkDirectMessagesAsReadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const handleTabChange = (tabIndex: TabType) => setTabIndex(tabIndex)
  const handleMemberClick = (member: User) => {
    markDirectMessagesAsRead({ threadId: threadId || '' })
    handleMessageRead(member.id)
    onMessageClick(member)
  }

  const handleManageMembersClick = () => setViewMode(ViewMode.MANAGE_MEMBERS)
  const handleAgentStoreClick = () => setViewMode(ViewMode.AGENT_STORE)
  const handleBack = () => {
    setViewMode(ViewMode.TAB_VIEW)
    setAgentDetailId(null)
    setSelectedAgent(null)
    setAddAgent(null)
  }

  switch (viewMode) {
    case ViewMode.MANAGE_MEMBERS:
      return <ManageMembersView onBack={handleBack} />
    case ViewMode.AGENT_STORE:
      return (
        <Stack flex={1} height="100%" minHeight={0} px={2} spacing={2}>
          <AgentStore
            onAddAgent={() => setViewMode(ViewMode.ADD_AGENT)}
            onBack={handleBack}
          />
        </Stack>
      )
    case ViewMode.AGENT_DETAIL:
      if (agentDetailId) {
        return <AgentDetail agentId={agentDetailId} onBack={handleBack} />
      }
      break
    case ViewMode.ADD_AGENT:
      return <AddAgentDetail onBack={handleBack} />
    default:
      break
  }

  return (
    <Stack flex={1} minHeight={0} px={2} spacing={2}>
      <TabHeader
        onAgentStoreClick={handleAgentStoreClick}
        onManageClick={handleManageMembersClick}
        onTabChange={handleTabChange}
        tabIndex={tabIndex}
      />

      {tabIndex === TabType.AI_AGENTS ? (
        <AgentsTab onAgentClick={() => setViewMode(ViewMode.AGENT_DETAIL)} />
      ) : (
        <MembersTab
          currentUserId={user?.id}
          members={members}
          membersWithUnreads={membersWithUnreads}
          onMemberClick={handleMemberClick}
          threadId={threadId}
        />
      )}
    </Stack>
  )
}
