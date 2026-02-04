import { CalendarMonth, SmartToyOutlined } from '@mui/icons-material'
import { Divider, Stack, Typography } from '@mui/material'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { Button, IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import _ from 'lodash'
import { useEffect, useState } from 'react'

import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'

import MeetingCard from './MeetingCard'

type CompanionStatusGroups = Record<string, MeetingSession[]>

// Configuration for the four main status groups
const STATUS_GROUP_CONFIG = [
  {
    bgcolor: '#e1f5fe',
    key: 'upcoming',
    label: 'Upcoming',
    statuses: ['scheduled'],
  },
  {
    bgcolor: '#e8f5e9',
    key: 'inprogress',
    label: 'In Progress',
    statuses: ['waiting_to_join', 'in_meeting', 'paused'],
  },
  {
    bgcolor: '#e8eaed',
    key: 'completed',
    label: 'Completed',
    statuses: [
      'not_admitted',
      'finished',
      'completed',
      'stale_recording',
      'stale_waiting',
    ],
  },
  {
    bgcolor: '#eceff1',
    key: 'unknown',
    label: 'Unknown',
    statuses: ['unknown'],
  },
]

type ActiveState = 'COMPANION' | 'MEETING'

interface Props {
  meetings: MeetingSession[]
  isLoading: boolean
  setActive: (active: ActiveState) => void
}

export default function MeetingContainer({
  meetings,
  isLoading,
  setActive,
}: Props) {
  const { user } = useAuthContext()

  const tz = user?.timezone ?? 'UTC'

  const dateToday = dayjs().tz(tz)

  const weekStart = dateToday.startOf('week')
  const weekEnd = dateToday.endOf('week')

  const [groups, setGroups] = useState<CompanionStatusGroups>({})
  const [isToday, setIsToday] = useState(true)

  useEffect(() => {
    if (isLoading) return

    // Filter meetings based on date range
    const filteredMeetings = meetings.filter((meeting) => {
      if (!meeting.start_at) return false

      const meetingDate = dayjs.tz(meeting.start_at, tz)

      if (isToday) {
        // Check if meeting is today
        return meetingDate.isSame(dateToday, 'day')
      } else {
        // Check if meeting is within this week
        return (
          meetingDate.isSameOrAfter(weekStart, 'day') &&
          meetingDate.isSameOrBefore(weekEnd, 'day')
        )
      }
    })

    // First, determine the status for each meeting
    const meetingsWithGroupedStatus = filteredMeetings.map((meeting) => {
      let status = 'unknown'

      if (!meeting.companion_details) {
        status = 'scheduled'
      } else {
        status = meeting.companion_details.status || 'unknown'
      }

      // Map to the grouped status
      let groupKey = 'unknown'
      for (const config of STATUS_GROUP_CONFIG) {
        if (config.statuses.includes(status)) {
          groupKey = config.key
          break
        }
      }

      return { ...meeting, groupKey }
    })

    // Group by the grouped status
    const groupedByStatus = _.groupBy(meetingsWithGroupedStatus, 'groupKey')

    // Sort each group by start_at (descending - most recent first)
    const sortedGroups = _.mapValues(groupedByStatus, (group) =>
      _.orderBy(
        group,
        [
          (meeting) =>
            meeting.start_at ? new Date(meeting.start_at).getTime() : 0,
        ],
        ['desc'],
      ),
    )

    setGroups(sortedGroups)
  }, [meetings, isLoading, isToday, dateToday, weekStart, weekEnd, tz])

  return (
    <Stack gap={2} height="100%" width="100%">
      <Stack
        alignItems="center"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Stack alignItems="center" flexDirection="row" gap={1}>
          <Typography variant="h6">
            {isToday ? "Today's Meetings" : `Meetings this Week`}
          </Typography>
          {!isToday && (
            <Typography fontSize={14} variant="h6">
              ({weekStart.format('MMMM D, YYYY')} -{' '}
              {weekEnd.format('MMMM D, YYYY')})
            </Typography>
          )}
        </Stack>
        <Stack alignItems="center" flexDirection="row" gap={2}>
          <Stack
            alignItems="center"
            divider={<Divider flexItem={true} orientation="vertical" />}
            flexDirection="row"
            gap={1}
          >
            <Button
              onClick={() => setIsToday(true)}
              sx={{
                color: isToday ? 'primary.main' : 'text.secondary',
              }}
              variant="text"
            >
              Today
            </Button>
            <Button
              onClick={() => setIsToday(false)}
              sx={{
                color: !isToday ? 'primary.main' : 'text.secondary',
              }}
              variant="text"
            >
              Week
            </Button>
          </Stack>
          <Stack
            bgcolor="grey.100"
            borderRadius={2}
            flexDirection="row"
            gap={0.5}
            p={0.5}
          >
            <IconButton
              onClick={() => setActive('COMPANION')}
              sx={{
                '&:hover': {
                  backgroundColor: 'grey.200',
                },
                backgroundColor: 'transparent',
                borderRadius: 1,
                color: 'text.secondary',
                padding: 1,
              }}
            >
              <SmartToyOutlined sx={{ fontSize: 16 }} />
            </IconButton>

            <IconButton
              onClick={() => setActive('MEETING')}
              sx={{
                '&:hover': {
                  backgroundColor: 'common.white',
                },
                backgroundColor: 'common.white',
                borderRadius: 1,
                color: 'primary.main',
                padding: 1,
              }}
            >
              <CalendarMonth sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        gap={2}
        height="100%"
        sx={{
          overflowX: 'auto',
        }}
        width="100%"
      >
        {isLoading ? (
          <Stack direction="row" gap={2} height="100%" width="100%">
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
            <LoadingSkeleton height="100%" width="100%" />
          </Stack>
        ) : (
          <>
            {STATUS_GROUP_CONFIG.map((groupConfig) => {
              const companions = groups[groupConfig.key] || []

              // Skip unknown group if it's empty
              if (groupConfig.key === 'unknown' && companions.length === 0) {
                return null
              }

              return (
                <Stack
                  border={1}
                  borderColor="divider"
                  borderRadius={2}
                  divider={<Divider />}
                  flex={1}
                  gap={2}
                  height="100%"
                  key={groupConfig.key}
                  maxHeight="100%"
                  minWidth={300}
                  p={2}
                >
                  <Typography
                    bgcolor={groupConfig.bgcolor}
                    borderRadius={100}
                    p={0.5}
                    textAlign="center"
                  >
                    {groupConfig.label} ({companions.length})
                  </Typography>

                  <Stack
                    divider={<Divider />}
                    gap={2}
                    height="100%"
                    sx={{
                      overflowY: 'auto',
                    }}
                  >
                    {companions.map((companion, index) => (
                      <MeetingCard
                        color={groupConfig.bgcolor}
                        date={companion.start_at ?? null}
                        isBotInvited={companion.invite_pulse}
                        key={companion.id || index}
                        meetingName={companion.name || 'Meeting'}
                        meetingUrl={companion.meetingUrl || '#'}
                        pulseName={companion.pulse?.name ?? ' Unknown Pulse'}
                        status={companion.companion_details?.status ?? null}
                      />
                    ))}
                  </Stack>
                </Stack>
              )
            })}
          </>
        )}
      </Stack>
    </Stack>
  )
}
