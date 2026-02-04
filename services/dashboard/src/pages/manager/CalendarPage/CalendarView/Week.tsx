import { Circle, CircleOutlined, Videocam } from '@mui/icons-material'
import { alpha, darken, Stack, Typography } from '@mui/material'
import { Event as RawEventType } from '@zunou-graphql/core/graphql'
import { useGetEventInstances } from '@zunou-queries/core/hooks/useGetEventInstances'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { getEventColor } from '~/utils/event'

import { SelectedWeek } from '..'

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

const HOUR_HEIGHT = 100 // pixels per hour

interface TransformedWeekEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD format
  dayOfWeek: number // 0 = Sunday, 6 = Saturday
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  color: string
  original: RawEventType
}

interface EventPosition {
  top: number
  height: number
  left: number
  width: number
}

interface Props {
  selectedWeek: SelectedWeek
  setSelectedEvent: (event: RawEventType) => void
}

export default function Week({ selectedWeek, setSelectedEvent }: Props) {
  const { user } = useAuthContext()
  const userTimezone = user?.timezone ?? 'UTC'
  const { pulseId, organizationId } = useParams()

  const [currentTime, setCurrentTime] = useState(dayjs().tz(userTimezone))
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const {
    data: rawEvents,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useGetEventInstances({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(organizationId && pulseId && user?.id),
    variables: {
      dateRange: [selectedWeek.startDate, selectedWeek.endDate],
      organizationId,
      perPage: 1000,
      pulseId,
      userId: user?.id,
    },
  })

  // Refetch events when a new data source is created so when clicked
  // it will show the post meeting modal instead of pre meeting
  usePusherChannel({
    channelName: `data-source.${organizationId}.pulse.${pulseId}`,
    eventName: '.data-source-created',
    onEvent: () => refetchEvents(),
  })

  // Refetch events when syncing is completed
  usePusherChannel({
    channelName:
      organizationId && `calendar-sync.organization.${organizationId}`,
    eventName: '.google-calendar-sync-completed',
    onEvent: () => refetchEvents(),
  })

  // Transform raw events to week events with timezone awareness
  const events: TransformedWeekEvent[] = (rawEvents?.eventInstances ?? [])
    .map((instance) => {
      const event = instance.event

      if (!event) return null

      const startDate = dayjs.tz(event.start_at, userTimezone)
      const endDate = dayjs.tz(event.end_at, userTimezone)

      return {
        color: getEventColor(event.id, event.priority ?? undefined),
        date: startDate.format('YYYY-MM-DD'),
        dayOfWeek: startDate.day(),
        endHour: endDate.hour(),
        endMinute: endDate.minute(),

        id: event.id,

        original: event,

        // 0 = Sunday, 6 = Saturday
        startHour: startDate.hour(),

        startMinute: startDate.minute(),
        title: event.name,
      }
    })
    .filter(Boolean) as TransformedWeekEvent[]

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().tz(userTimezone))
    }, 60000)
    return () => clearInterval(interval)
  }, [userTimezone])

  // Generate array of days for the selected week
  const daysOfWeek = selectedWeek.startDate
    ? Array.from({ length: 7 }, (_, i) =>
        dayjs(selectedWeek.startDate).tz(userTimezone).add(i, 'day'),
      )
    : Array.from({ length: 7 }, (_, i) =>
        dayjs().tz(userTimezone).startOf('week').add(i, 'day'),
      )

  const hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }

  const formatTime = (hour: number, minute: number): string => {
    const hourStr = hour === 0 ? '12' : hour > 12 ? `${hour - 12}` : `${hour}`
    const minuteStr = `:${minute.toString().padStart(2, '0')}`
    const period = hour < 12 ? 'AM' : 'PM'
    return `${hourStr}${minuteStr} ${period}`
  }

  const getEventMinutes = (event: TransformedWeekEvent) => {
    return {
      end: event.endHour * 60 + event.endMinute,
      start: event.startHour * 60 + event.startMinute,
    }
  }

  const eventsOverlap = (
    event1: TransformedWeekEvent,
    event2: TransformedWeekEvent,
  ): boolean => {
    const e1 = getEventMinutes(event1)
    const e2 = getEventMinutes(event2)
    return e1.start < e2.end && e2.start < e1.end
  }

  const getEventPositionsForDay = (
    day: dayjs.Dayjs,
  ): Map<string, EventPosition> => {
    const positions = new Map<string, EventPosition>()
    const dayDateStr = day.format('YYYY-MM-DD')
    const dayEvents = events.filter((e) => e.date === dayDateStr)

    const sortedEvents = [...dayEvents].sort((a, b) => {
      const aStart = a.startHour * 60 + a.startMinute
      const bStart = b.startHour * 60 + b.startMinute
      return aStart - bStart
    })

    // Assign each event to a column where it doesn't overlap with any other event
    const columns: TransformedWeekEvent[][] = []

    sortedEvents.forEach((event) => {
      let placed = false
      // Try to place in existing columns
      for (const column of columns) {
        const hasOverlap = column.some((e) => eventsOverlap(e, event))
        if (!hasOverlap) {
          column.push(event)
          placed = true
          break
        }
      }
      // If no column works, create a new one
      if (!placed) {
        columns.push([event])
      }
    })

    // Calculate width for each event based on total columns needed
    const totalColumns = columns.length
    const columnWidth = 100 / totalColumns

    // Assign positions based on column and time
    columns.forEach((column, columnIndex) => {
      column.forEach((event) => {
        const minutes = getEventMinutes(event)
        const duration = minutes.end - minutes.start

        positions.set(event.id, {
          height: Math.max((duration / 60) * HOUR_HEIGHT, 20),
          left: columnIndex * columnWidth,
          top: (minutes.start / 60) * HOUR_HEIGHT,
          width: columnWidth - 0.5, // Small gap between columns
        })
      })
    })

    return positions
  }

  const getCurrentTimePosition = (): number => {
    const minutes = currentTime.hour() * 60 + currentTime.minute()
    return (minutes / 60) * HOUR_HEIGHT
  }

  const isToday = (day: dayjs.Dayjs): boolean => {
    return day.isSame(currentTime, 'day')
  }

  const isSunday = (day: dayjs.Dayjs): boolean => {
    return day.format('dddd') === 'Sunday'
  }

  // Check if current week contains today
  // const isTodayInWeek = daysOfWeek.some((day) => isToday(day))

  // Auto-scroll to current time when week changes or on initial load
  useEffect(() => {
    if (!scrollContainerRef.current || isLoadingEvents) return

    // Use requestAnimationFrame to ensure DOM is fully rendered before scrolling
    const animationFrame = requestAnimationFrame(() => {
      const container = scrollContainerRef.current
      if (!container) return

      // Always scroll to current time
      const targetPosition =
        getCurrentTimePosition() - container.clientHeight / 2

      container.scrollTo({
        behavior: 'smooth',
        top: Math.max(targetPosition, 0),
      })
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [selectedWeek.startDate, isLoadingEvents, currentTime])

  if (isLoadingEvents) {
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        width="100%"
      >
        <LoadingSpinner />
      </Stack>
    )
  }

  return (
    <Stack
      border={1}
      borderRadius={2}
      height="100vh"
      sx={{ borderColor: 'divider', overflow: 'hidden' }}
      width="100%"
    >
      {/* Week Header */}
      <Stack
        bgcolor="white"
        borderColor="divider"
        direction="row"
        sx={{ flexShrink: 0 }}
      >
        {/* Time column header */}
        <Stack width={80} />

        {/* Day headers */}
        {daysOfWeek.map((day, index) => {
          const isCurrentSunday = isSunday(day)
          return (
            <Stack
              alignItems="flex-start"
              bgcolor={
                isToday(day)
                  ? alpha(theme.palette.error.light, 0.1)
                  : isCurrentSunday
                    ? 'grey.50'
                    : 'transparent'
              }
              borderLeft={1}
              flex={1}
              justifyContent="flex-start"
              key={index}
              p={1}
              pb={4}
              sx={{
                borderColor: 'divider',
              }}
            >
              <Typography
                color="text.secondary"
                sx={{ fontWeight: 500 }}
                variant="caption"
              >
                {day.format('ddd').toUpperCase()}
              </Typography>
              <Typography
                sx={{
                  alignItems: 'center',
                  borderRadius: '50%',
                  color: 'text.primary',
                  display: 'flex',
                  fontWeight: 500,
                  justifyContent: 'center',
                }}
                variant="h5"
              >
                {day.format('D')}
              </Typography>
            </Stack>
          )
        })}
      </Stack>

      {/* Week Grid */}
      <Stack
        direction="row"
        flex={1}
        ref={scrollContainerRef}
        sx={{ overflowY: 'auto', position: 'relative' }}
      >
        {/* Time labels column */}
        <Stack
          sx={{
            bgcolor: 'white',
            borderColor: 'divider',
            left: 0,
            minHeight: HOUR_HEIGHT * 24,
            position: 'sticky',
            zIndex: 2,
          }}
          width={80}
        >
          {hours.map((hour) => (
            <Stack
              key={hour}
              sx={{
                alignItems: 'center',
                height: HOUR_HEIGHT,
                justifyContent: 'flex-start',
                position: 'relative',
              }}
            >
              <Typography
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  pt: 0.5,
                }}
                variant="caption"
              >
                {formatHour(hour)}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {/* Days columns */}
        {daysOfWeek.map((day, dayIndex) => {
          const eventPositions = getEventPositionsForDay(day)
          const dayDateStr = day.format('YYYY-MM-DD')
          const isCurrentSunday = isSunday(day)

          return (
            <Stack
              borderLeft={1}
              flex={1}
              key={dayIndex}
              sx={{
                bgcolor: isToday(day)
                  ? alpha(theme.palette.error.light, 0.1)
                  : isCurrentSunday
                    ? 'grey.50'
                    : 'white',
                borderColor: 'divider',
                minHeight: HOUR_HEIGHT * 24,
                position: 'relative',
              }}
            >
              {/* Hour lines */}
              {hours.map((hour) => (
                <Stack
                  borderTop={1}
                  key={hour}
                  sx={{
                    borderColor: 'divider',
                    height: HOUR_HEIGHT,
                  }}
                />
              ))}

              {/* Current time indicator */}
              {isToday(day) && (
                <Stack
                  sx={{
                    '&::before': {
                      bgcolor: 'error.light',
                      borderRadius: '50%',
                      content: '""',
                      height: 10,
                      left: -6,
                      position: 'absolute',
                      top: -4,
                      width: 10,
                    },
                    bgcolor: 'error.light',
                    height: 2,
                    left: 0,
                    position: 'absolute',
                    right: 0,
                    top: getCurrentTimePosition(),
                    zIndex: 3,
                  }}
                />
              )}

              {/* Events for this day */}
              {events
                .filter((event) => event.date === dayDateStr)
                .map((event) => {
                  const position = eventPositions.get(event.id)
                  if (!position) return null

                  return (
                    <Stack
                      borderLeft={4}
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event.original)
                      }}
                      overflow="hidden"
                      sx={{
                        '&:hover': {
                          boxShadow: 2,
                          opacity: 0.8,
                        },
                        bgcolor: event.color,
                        borderColor: darken(event.color, 0.3),
                        borderRadius: 1,
                        color: 'white',
                        cursor: 'pointer',
                        height: position.height,
                        left: `calc(${position.left}% + 4px)`,
                        opacity: event.original.meetingSession ? 1 : 0.5,
                        overflow: 'hidden',
                        p: 0.5,
                        position: 'absolute',
                        top: position.top,
                        width: `calc(${position.width}% - 4px)`,
                      }}
                    >
                      <Stack alignItems="center" direction="row" gap={1}>
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            lineHeight: 1.5,
                            opacity: 0.9,
                          }}
                          variant="caption"
                        >
                          {formatTime(event.startHour, event.startMinute)} –{' '}
                          {formatTime(event.endHour, event.endMinute)}
                        </Typography>
                        <Stack
                          alignItems="center"
                          bgcolor={darken(event.color, 0.3)}
                          borderRadius="50%"
                          justifyContent="center"
                          p={0.2}
                        >
                          <Videocam
                            sx={{
                              fontSize: 8,
                            }}
                          />
                        </Stack>
                      </Stack>
                      <Stack
                        sx={{
                          alignItems: 'center',
                          flexDirection: 'row',
                          gap: 0.5,
                        }}
                      >
                        {event.original.meetingSession &&
                        event.original.meetingSession.invite_pulse ? (
                          <Circle
                            sx={{
                              color: 'primary.light',
                              fontSize: 10,
                            }}
                          />
                        ) : (
                          <CircleOutlined
                            sx={{
                              color: 'primary.light',
                              fontSize: 10,
                            }}
                          />
                        )}
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            lineHeight: 1.5,
                          }}
                          variant="caption"
                        >
                          {event.title}
                        </Typography>
                      </Stack>
                    </Stack>
                  )
                })}
            </Stack>
          )
        })}
      </Stack>
    </Stack>
  )
}
