import { GroupOutlined } from '@mui/icons-material'
import { Avatar, AvatarGroup, Stack, Tooltip, Typography } from '@mui/material'
import { Participant } from '@zunou-graphql/core/graphql'

import { Detail, Row } from './Layout'

interface ParticipantsSectionProps {
  participants?: Participant[]
}

export function ParticipantsSection({
  participants = [],
}: ParticipantsSectionProps) {
  const totalAttendees = participants?.length ?? 0

  return (
    <Row>
      <Detail>
        <GroupOutlined sx={{ fontSize: 15 }} />
        <Stack alignItems="center" direction="row" gap={1}>
          <Typography variant="body2">{totalAttendees} going</Typography>
          <AvatarGroup
            max={5}
            sx={{
              '& .MuiAvatar-root': {
                fontSize: '10px',
                height: 20,
                width: 20,
              },
            }}
          >
            {participants.map((participant) => (
              <Tooltip
                key={participant.id}
                title={participant.name || 'Unknown'}
              >
                <Avatar
                  src={participant.gravatar ?? undefined}
                  sx={{ fontSize: '10px', height: 20, width: 20 }}
                >
                  {participant.name?.slice(0, 1).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        </Stack>
      </Detail>
    </Row>
  )
}
