import { Groups } from '@mui/icons-material'
import { Typography } from '@mui/material'
import { alpha, Stack } from '@mui/system'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import EventMeeting, { EventWithInstanceId } from './EventMeeting'
import { Meeting } from './Meeting'

// Combined unique attendees and external_participants
export interface MeetingSessionWithParticipants extends MeetingSession {
  participants: string[]
}

interface MeetingListProps {
  meetings?: MeetingSession[]
  googleCalendarMeetings?: EventWithInstanceId[]
  isGoogleCalMode?: boolean
  isQueried?: boolean
  isVitalsMode?: boolean
}

const EmptyMeetings = ({ text }: { text: string }) => {
  return (
    <Stack alignItems="center" gap={2} justifyContent="center" pt={2}>
      <Stack
        sx={{
          alignItems: 'center',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
          borderRadius: '50%',
          display: 'flex',
          height: 80,
          justifyContent: 'center',
          width: 80,
        }}
      >
        <Groups sx={{ color: theme.palette.grey[400], fontSize: 40 }} />
      </Stack>
      <Stack alignItems="center">
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 500, textAlign: 'center' }}
          variant="caption"
        >
          {text}
        </Typography>
      </Stack>
    </Stack>
  )
}

export const MeetingList = ({
  meetings = [],
  googleCalendarMeetings = [],
  isGoogleCalMode = false,
  isQueried = false,
  isVitalsMode = false,
}: MeetingListProps) => {
  const { t } = useTranslation('vitals')
  const [text, setText] = useState('')

  useEffect(() => {
    if (isQueried) setText(t('no_meetings_matched_search'))
    else setText(t('no_meetings_scheduled'))
  }, [isQueried])

  if (isGoogleCalMode)
    return (
      <Stack flex={1} gap={2} height="100%" overflow="auto" px={2} width="100%">
        {googleCalendarMeetings.length > 0 ? (
          googleCalendarMeetings.map((meeting) => (
            <EventMeeting
              googleCalendarMeeting={meeting}
              isVitalsMode={isVitalsMode}
              key={meeting.id}
            />
          ))
        ) : (
          <Stack
            sx={{
              alignItems: 'center',
              height: '100%',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <EmptyMeetings text={t('no_meetings')} />
          </Stack>
        )}
      </Stack>
    )

  return (
    <Stack flex={1} gap={2} height="100%" overflow="auto" px={2} width="100%">
      {meetings.length > 0 ? (
        meetings.map((meeting, index) => (
          <Meeting
            isGoogleCalMode={isGoogleCalMode}
            isVitalsMode={isVitalsMode}
            // Use index instead of id due to possible duplicates
            key={index}
            meeting={meeting}
          />
        ))
      ) : (
        <Stack
          sx={{
            alignItems: 'center',
            height: '100%',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <EmptyMeetings text={text} />
        </Stack>
      )}
    </Stack>
  )
}
