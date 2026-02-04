import { Stack } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

import { MemberItem } from './MemberItem'

interface MembersListProps {
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

export const MembersList = ({
  members,
  isLoading,
  membersWithUnreads,
  currentUserId,
  onMessageClick,
  onMemberClick,
  vitalsMode,
  isDarkMode,
  threadId,
}: MembersListProps) => {
  const renderLoadingSkeletons = () => (
    <Stack mt={4} spacing={3}>
      {[1, 2, 3].map((index) => (
        <Stack
          alignItems="center"
          borderBottom="1px solid #E0E0E0"
          direction="row"
          key={index}
          pb={2}
          spacing={1}
        >
          <LoadingSkeleton height={40} variant="rounded" width={40} />
          <Stack flex={1} spacing={0.5}>
            <LoadingSkeleton height={24} variant="text" width="30%" />
            <LoadingSkeleton height={20} variant="text" width="50%" />
          </Stack>
        </Stack>
      ))}
    </Stack>
  )

  if (isLoading) {
    return renderLoadingSkeletons()
  }

  return (
    <Stack mt={4} spacing={3}>
      {members.map((member) => (
        <MemberItem
          currentUserId={currentUserId}
          hasUnreadMessages={membersWithUnreads.has(member.id)}
          isDarkMode={isDarkMode}
          key={member.id}
          member={member}
          onMemberClick={onMemberClick}
          onMessageClick={onMessageClick}
          threadId={threadId}
          vitalsMode={vitalsMode}
        />
      ))}
    </Stack>
  )
}
