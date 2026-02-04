import { LinkOutlined } from '@mui/icons-material'
import { Avatar, Chip, Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import {
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { useGetMeetingSessionsQuery } from '@zunou-queries/core/hooks/useGetMeetingSessionsQuery'
import { Link } from '@zunou-react/components/navigation'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'
import { getFirstLetter } from '~/utils/textUtils'

export const CollaborationMessage = () => {
  const { pulseId } = useParams<{ pulseId: string }>()
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()

  const { data: meetingSessionsData } = useGetMeetingSessionsQuery({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      organizationId: organizationId || '',
      pulseId: pulseId || '',
      type: MeetingSessionType.Collab,
      userId: user?.id || '',
    },
  })

  const activeCollabSession = useMemo(() => {
    if (
      !meetingSessionsData?.meetingSessions?.length ||
      !pulseId ||
      !organizationId ||
      !user?.id
    ) {
      return null
    }

    // Get the most recent active COLLAB session
    const collabSessions = meetingSessionsData.meetingSessions.filter(
      (session) =>
        session.type === MeetingSessionType.Collab &&
        session.status === MeetingSessionStatus.Active,
    )
    return collabSessions[collabSessions.length - 1]
  }, [meetingSessionsData, pulseId, organizationId, user?.id])

  if (!activeCollabSession) return null

  return (
    <Stack direction="row" spacing={2} width="100%">
      <Stack direction="row-reverse" spacing={-2}>
        {activeCollabSession.attendees
          .filter(
            (attendee): attendee is NonNullable<typeof attendee> =>
              attendee != null,
          )
          .map((attendee) => {
            if (!attendee.user) return null

            const {
              id,
              user: { gravatar, name },
            } = attendee

            return (
              <Avatar
                color="primary.main"
                key={id}
                src={gravatar || undefined}
                sx={
                  activeCollabSession.attendees.length === 1
                    ? {
                        borderRadius: 2,
                        height: 48,
                        width: 48,
                      }
                    : undefined
                }
                variant="rounded"
              >
                {!gravatar && getFirstLetter(name || '')}
              </Avatar>
            )
          })}
      </Stack>
      <Stack
        maxWidth="100%"
        spacing={2}
        sx={{
          bgcolor: alpha(theme.palette.common.lime, 0.1),
          border: 1,
          borderColor: 'common.lime',
          borderRadius: '0px 16px 16px 16px',
          minWidth: 240,
          padding: 2,
          width: '50%',
        }}
      >
        <Stack alignItems="center" direction="row" spacing={1}>
          <Typography fontWeight="bold" variant="body2">
            A collab is happening
          </Typography>
          <Chip
            label="LIVE"
            size="small"
            sx={{
              bgcolor: 'common.lime',
              color: 'common.white',
              paddingX: 0.5,
              width: 'fit-content',
            }}
          />
          <Typography color="text.secondary" fontSize={12} variant="subtitle2">
            {dayjs(activeCollabSession.start_at).format('LT')}
          </Typography>
        </Stack>
        <Typography variant="body2">
          To join the meeting click the link:
          <Stack alignItems="center" direction="row" spacing={0.5}>
            <LinkOutlined fontSize="small" />
            <Link href={activeCollabSession.meetingUrl}>
              {activeCollabSession.meetingUrl}
            </Link>
          </Stack>
        </Typography>

        <Stack spacing={0}>
          <Typography variant="subtitle2">
            Invited:{' '}
            {activeCollabSession.attendees
              .filter(
                (attendee): attendee is NonNullable<typeof attendee> =>
                  attendee != null,
              )
              .map((attendee) => attendee.user?.name)
              .filter((name): name is string => name != null)
              .join(', ')}
          </Typography>
          {activeCollabSession.external_attendees &&
            activeCollabSession.external_attendees.length > 0 && (
              <Typography variant="subtitle2">
                {activeCollabSession.external_attendees.join(', ')}
                {' (external)'}
              </Typography>
            )}
        </Stack>
      </Stack>
    </Stack>
  )
}
