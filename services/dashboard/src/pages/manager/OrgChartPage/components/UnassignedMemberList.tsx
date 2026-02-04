import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PeopleOutline } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { PulseMember } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useTranslation } from 'react-i18next'

import { MemberCard } from './MemberCard'

interface UnassignedMemberListProps {
  members: PulseMember[]
  isExpanded: boolean
  canEdit: boolean
}

export const UnassignedMemberList = ({
  members,
  isExpanded,
  canEdit,
}: UnassignedMemberListProps) => {
  const { t } = useTranslation('org')
  const { setNodeRef } = useDroppable({
    data: {
      type: 'group',
    },
    id: 'UNASSIGNED',
  })

  const alphabeticallySortedMembers = members.sort((a, b) => {
    return a.user.name.localeCompare(b.user.name)
  })

  return (
    <Stack
      height="100%"
      ref={setNodeRef}
      sx={{
        gap: 2,
        height: '100%',
        overflowY: 'scroll',
        px: 3,
        py: 3,
      }}
    >
      {members.length > 0 ? (
        <SortableContext
          items={alphabeticallySortedMembers.map((member) => member.id)}
          strategy={verticalListSortingStrategy}
        >
          {alphabeticallySortedMembers.map((member) => (
            <MemberCard
              canEdit={canEdit}
              isExpanded={isExpanded}
              key={member.id}
              member={{
                ...member,
                groupId: 'UNASSIGNED',
              }}
            />
          ))}
        </SortableContext>
      ) : (
        <Stack
          alignItems="center"
          alignSelf="center"
          flexGrow={1}
          justifyContent="center"
          justifySelf="center"
          spacing={2}
          width="80%"
        >
          <Stack
            bgcolor={alpha(theme.palette.text.primary, 0.05)}
            border={1}
            borderColor="divider"
            borderRadius="50%"
            p={2}
          >
            <PeopleOutline sx={{ fontSize: 24 }} />
          </Stack>
          <Typography
            color="text.secondary"
            sx={{ mt: 1 }}
            textAlign="center"
            variant="body2"
          >
            {t('all_members_assigned')}
          </Typography>
        </Stack>
      )}
    </Stack>
  )
}
