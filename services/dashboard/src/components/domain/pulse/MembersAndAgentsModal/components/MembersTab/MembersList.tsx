import { Stack } from '@mui/material'
import { User } from '@zunou-graphql/core/graphql'

import { MemberItem } from './MemberItem'

interface MembersListProps {
  members: User[]
  membersWithUnreads: Set<string>
  currentUserId: string | undefined
  onMemberClick: (member: User) => void
  threadId: string | undefined
}

export const MembersList = ({
  members,
  membersWithUnreads,
  currentUserId,
  onMemberClick,
  threadId,
}: MembersListProps) => {
  return (
    <Stack mt={4} spacing={3}>
      {members.map((member) => (
        <MemberItem
          currentUserId={currentUserId}
          hasUnreadMessages={membersWithUnreads.has(member.id)}
          key={member.id}
          member={member}
          onMemberClick={onMemberClick}
          threadId={threadId}
        />
      ))}
    </Stack>
  )
}
