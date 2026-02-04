import {
  AccessTime,
  ArrowOutward,
  AutoAwesome,
  LocationOnOutlined,
} from '@mui/icons-material'
import { alpha, Box, Divider, Stack, Typography } from '@mui/material'
import { Event, EventPriority } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isWithinInterval,
} from 'date-fns'
import { useMemo, useState } from 'react'

import { AttendeesGroup } from './AttendeesGroup'

interface EventItemProps {
  event: Event
  onClick?: () => void
}

export const EventItem = ({ event, onClick }: EventItemProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const startDate = new Date(event.start_at)
  const endDate = new Date(event.end_at)
  const now = new Date()

  // gets the total event duration
  const durationMinutes = differenceInMinutes(endDate, startDate)
  const durationLabel = useMemo(() => {
    if (durationMinutes < 60) {
      return `${durationMinutes} m`
    }
    const hours = Math.floor(durationMinutes / 60)
    const mins = durationMinutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }, [durationMinutes])

  const isHappeningNow = useMemo(() => {
    return isWithinInterval(now, { end: endDate, start: startDate })
  }, [now, startDate, endDate])

  // label to know if the event is happening now or later
  const timeUntilEvent = useMemo(() => {
    if (isHappeningNow) return 'Now'
    if (startDate > now) {
      return `in ${formatDistanceToNowStrict(startDate)}`
    }
    return 'Event Ended'
  }, [isHappeningNow, startDate, now])

  const timeRange = `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')} (${durationLabel})`

  const attendeesCount = event.guests?.length

  const isOnline = Boolean(event.link)

  const getImportanceLabel = (priority: EventPriority | null | undefined) => {
    switch (priority) {
      case EventPriority.High:
        return 'HIGH IMPORTANCE'
      case EventPriority.Low:
        return 'LOW IMPORTANCE'
      case EventPriority.Medium:
        return 'MEDIUM IMPORTANCE'
      case EventPriority.Urgent:
        return 'URGENT IMPORTANCE'
      default:
        return null
    }
  }

  const getImportanceStyles = (priority: EventPriority | null | undefined) => {
    switch (priority) {
      case EventPriority.High:
        return {
          backgroundColor: theme.palette.warning.main + '20',
          color: theme.palette.warning.dark,
        }
      case EventPriority.Low:
        return {
          backgroundColor: theme.palette.common.lime + '20',
          color: theme.palette.common.lime,
        }
      case EventPriority.Medium:
        return {
          backgroundColor: theme.palette.common.dandelion + '20',
          color: theme.palette.common.dandelion,
        }
      case EventPriority.Urgent:
        return {
          backgroundColor: theme.palette.error.main + '25',
          color: theme.palette.error.dark,
        }
      default:
        return null
    }
  }

  const importanceLabel = getImportanceLabel(event.priority)
  const importanceStyles = getImportanceStyles(event.priority)

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        '&:hover': onClick
          ? {
              boxShadow: 2,
              transform: 'translateY(-2px)',
            }
          : {},
        backgroundColor: 'background.paper',
        borderRadius: '20px',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden',
        p: 2.5,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
      }}
    >
      <Stack spacing={2}>
        {/* Time Row */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: '20px',
              px: 1,
              py: 0.75,
            }}
          >
            <AccessTime
              sx={{
                color: theme.palette.primary.main,
                fontSize: 18,
              }}
            />
            <Typography variant="body2">{timeRange}</Typography>
          </Stack>
          {timeUntilEvent && (
            <Typography variant="body2">{timeUntilEvent}</Typography>
          )}
        </Stack>

        {/* Title Row */}
        <Typography
          color="text.primary"
          fontSize={16}
          fontWeight="fontWeightMedium"
        >
          {event.name}
        </Typography>

        {/* Description Row */}
        {event.summary && (
          <Stack direction="row" spacing={1}>
            <AutoAwesome
              sx={{
                color: theme.palette.common.cherry,
                fontSize: '18px',
              }}
            />
            <Typography variant="body2">{event.summary}</Typography>
          </Stack>
        )}

        {/* Importance & Attendees Row */}
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
        >
          <Stack alignItems="center" direction="row" spacing={1}>
            <Box
              sx={{
                borderRadius: '4px',
                px: 1.5,
                py: 0.5,
                ...importanceStyles,
              }}
            >
              <Typography sx={{ color: 'inherit' }} variant="body2">
                {importanceLabel}
              </Typography>
            </Box>
          </Stack>
          <Stack alignItems="center" direction="row" spacing={0.5}>
            <Typography color="text.secondary" variant="body2">
              {attendeesCount} going
            </Typography>
            {event.attendees && <AttendeesGroup attendees={event.guests} />}
          </Stack>
        </Stack>

        <Divider />

        {/* Location/Online Row */}
        {event.meetingSession?.dataSource?.id ? (
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Stack direction="row" spacing={1}>
              <Typography color="primary.main" variant="body2">
                Recorded
              </Typography>
              <Typography variant="body2">Transcript Available</Typography>
            </Stack>

            {isHovered && (
              <Stack alignItems="center" direction="row" spacing={0.5}>
                <Typography
                  color="secondary.main"
                  fontWeight="medium"
                  variant="body2"
                >
                  View Summary
                </Typography>
                <ArrowOutward
                  sx={{
                    color: 'secondary.main',
                    fontSize: 16,
                  }}
                />
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack alignItems="center" direction="row">
            <LocationOnOutlined
              sx={{ color: 'text.secondary', fontSize: 16 }}
            />
            {isOnline ? (
              <Typography variant="body2">Online</Typography>
            ) : (
              <Typography variant="body2">
                {event.location || 'No location specified'}
              </Typography>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  )
}

export default EventItem
