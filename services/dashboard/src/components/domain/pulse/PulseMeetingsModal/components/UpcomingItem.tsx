import { Circle, NorthEast } from '@mui/icons-material'
import { Divider, Stack, Tooltip, Typography } from '@mui/material'
import { Event, MeetingSession } from '@zunou-graphql/core/graphql'
import { SwitchInput } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { useMeetingPulse } from '../../../dataSource/InvitePulseToMeetingModal/components/Meeting'

interface Props {
  meetingSession: MeetingSession
  onClick: (event: Event) => void
}

export default function UpcomingItem({ meetingSession, onClick }: Props) {
  const { control, watch, setValue } = useForm({
    defaultValues: {
      [meetingSession.id]: meetingSession.invite_pulse,
    },
  })

  const { user } = useAuthContext()

  const timezone = user?.timezone ?? 'UTC'

  const meetingPulse = useMeetingPulse(meetingSession.id)

  const invitePulseValue = watch(meetingSession.id)

  const startAt = dayjs(meetingSession.start_at)
    .tz(timezone, true)
    .format('h:mm A')

  const endAt = dayjs(meetingSession.end_at).tz(timezone, true).format('h:mm A')

  useEffect(() => {
    if (invitePulseValue !== meetingSession.invite_pulse) {
      meetingPulse.updateInvitePulseStatus(invitePulseValue)
    }
  }, [invitePulseValue])

  useEffect(() => {
    setValue(meetingSession.id, meetingSession.invite_pulse)
  }, [meetingSession.invite_pulse])
  return (
    <Stack
      alignItems="stretch"
      direction="row"
      gap={1.5}
      justifyContent="space-between"
      minHeight={60}
      onClick={() => {
        if (meetingSession.event) onClick(meetingSession.event)
        else toast.error('Missing event.')
      }}
      sx={{
        '&:hover .action-btn': {
          opacity: 1,
          pointerEvents: 'auto',
        },
        cursor: 'pointer',
      }}
    >
      <Stack justifyContent="center" minWidth={70} width={70}>
        <Typography color="text.secondary" fontWeight={500} variant="body2">
          {startAt}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          -{endAt}
        </Typography>
      </Stack>

      <Stack
        alignItems="center"
        justifyContent="center"
        mx={2}
        position="relative"
      >
        <Divider orientation="vertical" sx={{ height: '100%' }} />
        <Circle
          sx={{
            color: theme.palette.common.gold,
            height: 12,
            left: '50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 12,
          }}
        />
      </Stack>

      <Stack
        alignItems="center"
        border={1}
        borderColor="divider"
        borderRadius={2}
        direction="row"
        flexGrow={1}
        gap={2}
        justifyContent="space-between"
        my={0.5}
        p={1.5}
      >
        <Tooltip placement="top" title={meetingSession.name}>
          <Typography
            fontWeight={500}
            sx={{
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              display: '-webkit-box',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
            variant="body2"
          >
            {meetingSession.name}
          </Typography>
        </Tooltip>

        <form onClick={(e) => e.stopPropagation()}>
          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="space-between"
          >
            <NorthEast
              className="action-btn"
              fontSize="small"
              sx={{
                color: 'secondary.light',
                opacity: 0,
                transition: 'opacity 0.2s ease',
              }}
            />

            <SwitchInput
              control={control}
              id={meetingSession.id}
              name={meetingSession.id}
            />
          </Stack>
        </form>
      </Stack>
    </Stack>
  )
}
