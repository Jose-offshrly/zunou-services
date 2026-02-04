import { Stack } from '@mui/material'
import { Pulse, User } from '@zunou-graphql/core/graphql'
import { useMarkDirectMessagesAsReadMutation } from '@zunou-queries/core/hooks/useMarkDirectMessagesAsReadMutation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import { useVitalsContext } from '~/context/VitalsContext'
import { useOrganization } from '~/hooks/useOrganization'
import { usePresence } from '~/hooks/usePresence'
import { getLastPathSegment } from '~/utils/urlUtils'

import { useUnreadMemberMessages } from '../../hooks'
import { SearchBar } from './SearchBar'
import { TabContent } from './TabContent'
import { TabHeader } from './TabHeader'
import { MembersTab } from './TeamTab'

interface PulseMembersListProps {
  pulseMembers: User[]
  isLoading: boolean
  onMessageClick: (member: User) => void
  vitalsMode: boolean
  pulse: Pulse | null
}

enum TabType {
  MEMBERS = 0,
  AI_AGENTS = 1,
}

enum ViewMode {
  TAB_VIEW,
  MANAGE_MEMBERS,
}

const RouteSegmentTabIndexMap: Record<string, number> = {
  '': 0,
  aiAgents: 1,
  members: 0,
}

export const PulseMembersList = ({
  pulseMembers,
  isLoading,
  onMessageClick,
  vitalsMode,
  pulse,
}: PulseMembersListProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuthContext()
  const { threadId } = useParams()
  const { organizationId } = useOrganization()

  const { setting } = useVitalsContext()
  const isDarkMode = setting.theme === 'dark'

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.TAB_VIEW)

  const routeSegment = getLastPathSegment(location.pathname, 5)
  const [tabIndex, setTabIndex] = useState<TabType>(() => {
    return RouteSegmentTabIndexMap[routeSegment] ?? TabType.MEMBERS
  })

  const { membersWithUnreads, handleMessageRead } = useUnreadMemberMessages({
    organizationId: organizationId || '',
  })

  const { mutate: markDirectMessagesAsRead } =
    useMarkDirectMessagesAsReadMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const userIds = useMemo(() => pulseMembers.map((m) => m.id), [pulseMembers])
  const presenceMap = usePresence(userIds)

  const handleMemberClick = (member: User) => {
    markDirectMessagesAsRead({ threadId: threadId || '' })
    handleMessageRead(member.id)
    onMessageClick(member)
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue as TabType)
  }

  const handleManageMembersClick = () => {
    setViewMode(ViewMode.MANAGE_MEMBERS)
  }

  const handleBackToTabs = () => {
    setViewMode(ViewMode.TAB_VIEW)
  }

  const filteredMembers = pulseMembers.filter((member) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      member.name.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower))
    )
  })

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const aHasUnread = membersWithUnreads.has(a.id)
      const bHasUnread = membersWithUnreads.has(b.id)

      if (aHasUnread && !bHasUnread) return -1
      if (!aHasUnread && bHasUnread) return 1
      return 0
    })
  }, [filteredMembers, membersWithUnreads])

  const membersWithPresence = sortedMembers.map((member) => ({
    ...member,
    presence: presenceMap[member.id] || member.presence,
  }))

  if (viewMode === ViewMode.MANAGE_MEMBERS) {
    return (
      <Stack px={2}>
        <MembersTab onBack={handleBackToTabs} />
      </Stack>
    )
  }

  return (
    <Stack px={2}>
      {!vitalsMode && (
        <TabHeader
          onManageClick={handleManageMembersClick}
          onTabChange={handleTabChange}
          pulse={pulse}
          tabIndex={tabIndex}
        />
      )}

      <SearchBar
        isDarkMode={isDarkMode && vitalsMode}
        onSearchChange={setSearchTerm}
        searchTerm={searchTerm}
        vitalsMode={vitalsMode}
      />

      <TabContent
        currentUserId={user?.id}
        isDarkMode={isDarkMode && vitalsMode}
        isLoading={isLoading}
        members={membersWithPresence}
        membersWithUnreads={membersWithUnreads}
        onMemberClick={handleMemberClick}
        onMessageClick={onMessageClick}
        tabIndex={tabIndex}
        threadId={threadId}
        vitalsMode={vitalsMode}
      />
    </Stack>
  )
}
