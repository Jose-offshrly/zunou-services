import { Avatar, Stack } from '@mui/material'
import { Assignee } from '@zunou-graphql/core/graphql'

import { TooltipWrapper } from '~/components/ui/TooltipWrapper'
import { getFirstLetter } from '~/utils/textUtils'

interface PulseTaskAssigneesGroup {
  assignees?: Assignee[] | null
  size?: 'small' | 'medium' | 'large'
}

export const PulseTaskAssigneesGroup = ({
  assignees,
  size = 'medium',
}: PulseTaskAssigneesGroup) => {
  const avatarSize = {
    large: 36,
    medium: 24,
    small: 20,
  }[size]

  const overlapOffset = avatarSize * 0.35

  return (
    <Stack alignItems="center" direction="row">
      {assignees?.map(({ id, user }, index) => {
        const { gravatar, name } = user
        return (
          <TooltipWrapper key={id} title={name}>
            <Avatar
              src={gravatar || undefined}
              sx={{
                border: '2px solid white',
                height: avatarSize,
                marginLeft: index === 0 ? 0 : `-${overlapOffset}px`,
                width: avatarSize,
                zIndex: assignees.length - index,
              }}
            >
              {!gravatar && getFirstLetter(name).toUpperCase()}
            </Avatar>
          </TooltipWrapper>
        )
      })}
    </Stack>
  )
}
