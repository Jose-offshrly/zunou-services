import { Avatar, Stack } from '@mui/material'

import { TooltipWrapper } from '~/components/ui/TooltipWrapper'
import { getFirstLetter } from '~/utils/textUtils'

interface Guest {
  name: string
  gravatar?: string | null
}

interface AttendeesGroupProps {
  attendees: Guest[] | null
}

export const AttendeesGroup = ({ attendees }: AttendeesGroupProps) => {
  const avatarSize = 24

  const overlapOffset = avatarSize * 0.35

  return (
    <Stack alignItems="center" direction="row">
      {attendees?.map(({ name, gravatar }, index) => {
        return (
          <TooltipWrapper key={index} title={name}>
            <Avatar
              src={gravatar || undefined}
              sx={{
                border: '2px solid white',
                height: avatarSize,
                marginLeft: index === 0 ? 0 : `-${overlapOffset}px`,
                width: avatarSize,
                zIndex: attendees.length - index,
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
