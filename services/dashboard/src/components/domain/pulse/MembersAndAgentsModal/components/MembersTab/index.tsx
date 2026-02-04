import { Stack } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { usePresence } from '~/hooks/usePresence'

import { SearchBar } from '../SearchBar'
import { MembersList } from './MembersList'

interface MembersTabProps {
  members: User[]
  membersWithUnreads: Set<string>
  currentUserId: string | undefined
  onMemberClick: (member: User) => void
  threadId: string | undefined
}

export const MembersTab = ({
  members,
  membersWithUnreads,
  currentUserId,
  onMemberClick,
  threadId,
}: MembersTabProps) => {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')

  const userIds = useMemo(() => members.map((m) => m.id), [members])
  const presenceMap = usePresence(userIds)

  const searchLower = searchTerm.toLowerCase()

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchLower) ||
          (member.email && member.email.toLowerCase().includes(searchLower)),
      ),
    [members, searchLower],
  )

  const sortedMembers = useMemo(
    () =>
      [...filteredMembers].sort((a, b) => {
        const aHasUnread = membersWithUnreads.has(a.id)
        const bHasUnread = membersWithUnreads.has(b.id)

        if (aHasUnread && !bHasUnread) return -1
        if (!aHasUnread && bHasUnread) return 1

        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      }),
    [filteredMembers, membersWithUnreads],
  )

  const membersWithPresence = useMemo(
    () =>
      sortedMembers.map((member) => ({
        ...member,
        presence: presenceMap[member.id] || member.presence,
      })),
    [sortedMembers, presenceMap],
  )

  return (
    <Stack spacing={1.5}>
      <SearchBar
        onSearchChange={setSearchTerm}
        placeholder={t('search_member')}
        searchTerm={searchTerm}
      />
      <MembersList
        currentUserId={currentUserId}
        members={membersWithPresence}
        membersWithUnreads={membersWithUnreads}
        onMemberClick={onMemberClick}
        threadId={threadId}
      />
    </Stack>
  )
}
