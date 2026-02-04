import { CircularProgress, Stack, Typography } from '@mui/material'
import {
  Event,
  MeetingSessionStatus,
  Origin,
} from '@zunou-graphql/core/graphql'
import { useMeetingSessions } from '@zunou-queries/core/hooks/useMeetingSessions'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useOrganization } from '~/hooks/useOrganization'

import EventDetailsModal from '../../EventDetailsModal'
import UpcomingItem from './UpcomingItem'

export default function UpcomingMeetings() {
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams()

  // Derived Values
  const timezone = user?.timezone ?? 'UTC'

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const startDate = dayjs().tz(timezone).format('YYYY-MM-DD')
  const endDate = dayjs().tz(timezone).add(1, 'week').format('YYYY-MM-DD')

  const { data: meetingSessionsData, isLoading: isMeetingSessionsLoading } =
    useMeetingSessions({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: {
        dateRange: [startDate, endDate],
        organizationId,
        origin: Origin.Pulse,
        pulseId,
        status: MeetingSessionStatus.Inactive,
      },
    })

  const upcomingMeetings = meetingSessionsData?.meetingSessions ?? []

  // Helper function to format day label
  const formatDayLabel = (meetingDate: dayjs.Dayjs) => {
    const today = dayjs().tz(timezone).startOf('day')
    const tomorrow = today.add(1, 'day')
    const meetingDay = meetingDate.tz(timezone).startOf('day')

    const dateStr = meetingDate.format('MMM D')

    if (meetingDay.isSame(today, 'day')) {
      return `Today, ${dateStr}`
    } else if (meetingDay.isSame(tomorrow, 'day')) {
      return `Tomorrow, ${dateStr}`
    } else {
      const dayOfWeek = meetingDate.format('dddd')
      return `${dayOfWeek}, ${dateStr}`
    }
  }

  // Group meetings by day
  const groupedByDay = React.useMemo(() => {
    const groups: Record<string, typeof upcomingMeetings> = {}

    upcomingMeetings.forEach((meeting) => {
      const date = dayjs(meeting.start_at)
      const dayKey = date.format('YYYY-MM-DD')

      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(meeting)
    })

    // Sort each group by earliest to latest
    Object.keys(groups).forEach((key) => {
      groups[key].sort(
        (a, b) => dayjs(a.start_at).valueOf() - dayjs(b.start_at).valueOf(),
      )
    })

    // Sort day keys by earliest to latest
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = dayjs(groups[a][0].start_at)
      const dateB = dayjs(groups[b][0].start_at)
      return dateA.valueOf() - dateB.valueOf()
    })

    return sortedKeys.map((key) => {
      const meetingDate = dayjs(groups[key][0].start_at)
      return {
        day: formatDayLabel(meetingDate),
        meetings: groups[key],
      }
    })
  }, [upcomingMeetings, timezone])

  // Loading state
  if (isMeetingSessionsLoading) {
    return (
      <Stack gap={2} height="100%">
        <Stack alignItems="center" height="100%" justifyContent="center">
          <CircularProgress size={20} />
        </Stack>
      </Stack>
    )
  }

  // Empty state
  if (upcomingMeetings.length === 0) {
    return (
      <Stack gap={2} height="100%">
        <Stack
          alignItems="center"
          gap={1}
          height="100%"
          justifyContent="center"
        >
          <Typography
            color="text.secondary"
            fontWeight={500}
            textAlign="center"
            variant="body1"
          >
            No Upcoming Meetings
          </Typography>

          <Typography color="text.secondary" textAlign="center" variant="body2">
            Your upcoming meetings will show up here once available.
          </Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack gap={2}>
      {groupedByDay.map(({ day, meetings }) => (
        <Stack gap={1} key={day}>
          <Typography color="text.secondary" fontWeight={500} variant="caption">
            {day}
          </Typography>
          <Stack>
            {meetings.map((meeting) => (
              <UpcomingItem
                key={meeting.id}
                meetingSession={meeting}
                onClick={setSelectedEvent}
              />
            ))}
          </Stack>
        </Stack>
      ))}

      {/* <MeetingDetailsModal
        eventId={selectedMeeting?.eventId ?? null}
        isOpen={Boolean(selectedMeeting)}
        meetingSessionId={selectedMeeting?.meetingSessionId ?? null}
        onClose={() => setSelectedMeeting(null)}
      /> */}

      <EventDetailsModal
        eventId={selectedEvent?.id ?? null}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
      />
    </Stack>
  )
}
