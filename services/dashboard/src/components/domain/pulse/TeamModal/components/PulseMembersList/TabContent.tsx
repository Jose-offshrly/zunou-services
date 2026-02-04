import { Stack, Typography } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'

import { MembersList } from './MembersList'

enum TabType {
  MEMBERS = 0,
  AI_AGENTS = 1,
}

interface TabContentProps {
  tabIndex: TabType
  members: User[]
  isLoading: boolean
  membersWithUnreads: Set<string>
  currentUserId: string | undefined
  onMessageClick: (member: User) => void
  onMemberClick: (member: User) => void
  vitalsMode: boolean
  isDarkMode: boolean
  threadId: string | undefined
}

export const TabContent = ({
  tabIndex,
  members,
  isLoading,
  membersWithUnreads,
  currentUserId,
  onMessageClick,
  onMemberClick,
  vitalsMode,
  isDarkMode,
  threadId,
}: TabContentProps) => {
  const renderAIAgentsContent = () => (
    <Typography mt={2}>AI Agents content goes here</Typography>
  )

  if (tabIndex === TabType.MEMBERS) {
    return (
      <Stack>
        <MembersList
          currentUserId={currentUserId}
          isDarkMode={isDarkMode}
          isLoading={isLoading}
          members={members}
          membersWithUnreads={membersWithUnreads}
          onMemberClick={onMemberClick}
          onMessageClick={onMessageClick}
          threadId={threadId}
          vitalsMode={vitalsMode}
        />
      </Stack>
    )
  }

  return renderAIAgentsContent()
}
