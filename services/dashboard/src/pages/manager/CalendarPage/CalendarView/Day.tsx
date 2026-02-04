import { Circle, CircleOutlined, Videocam } from '@mui/icons-material'
import { Box, darken, Stack, Typography } from '@mui/material'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Event as RawEventType } from '@zunou-graphql/core/graphql'
import { useGetEventInstances } from '@zunou-queries/core/hooks/useGetEventInstances'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { getEventColor } from '~/utils/event'

import { SelectedDay } from '..'

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

const HOUR_HEIGHT = 100 // pixels per hour

interface TransformedDayEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD format
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
  selectedDay: SelectedDay
  setSelectedDay: (day: SelectedDay) => void
  setSelectedEvent: (event: RawEventType) => void
}

export default function Day({
  selectedDay,
  setSelectedDay,
  setSelectedEvent,
}: Props) {
  const { user } = useAuthContext()
  const { pulseId, organizationId } = useParams()
  const userTimezone: string = user?.timezone ?? 'UTC'

  // Ref for the scrollable container (used for auto-scroll)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Use selectedDay.date or fallback to today
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    if (selectedDay.date) {
      return dayjs(selectedDay.date).tz(userTimezone)
    }
    return dayjs().tz(userTimezone)
  })

  const [currentTime, setCurrentTime] = useState<Dayjs>(
    dayjs().tz(userTimezone),
  )

  const {
    data: rawEvents,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useGetEventInstances({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(organizationId && pulseId && user?.id),
    variables: {
      dateRange: [selectedDate.format('DD-MM-YYYY')],
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

  // Transform raw events to day events with timezone awareness
  const events: TransformedDayEvent[] = (rawEvents?.eventInstances
    ?.map((instance) => {
      const event = instance.event

      if (!event) return null

      const startTime = dayjs.tz(event.start_at, userTimezone)
      const endTime = dayjs.tz(event.end_at, userTimezone)

      return {
        color: getEventColor(event.id, event.priority ?? undefined),
        date: startTime.format('YYYY-MM-DD'),
        endHour: endTime.hour(),
        endMinute: endTime.minute(),
        id: event.id,
        original: event,
        startHour: startTime.hour(),
        startMinute: startTime.minute(),
        title: event.name,
      }
    })
    ?.filter(Boolean) || []) as TransformedDayEvent[]

  // Update selectedDate when selectedDay prop changes
  useEffect(() => {
    if (selectedDay.date) {
      setSelectedDate(dayjs(selectedDay.date).tz(userTimezone))
    }
  }, [selectedDay.date, userTimezone])

  const hours: number[] = Array.from({ length: 24 }, (_, i) => i)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().tz(userTimezone))
    }, 60000)

    return () => clearInterval(interval)
  }, [userTimezone])

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

  const getEventMinutes = (event: TransformedDayEvent) => {
    return {
      end: event.endHour * 60 + event.endMinute,
      start: event.startHour * 60 + event.startMinute,
    }
  }

  const eventsOverlap = (
    event1: TransformedDayEvent,
    event2: TransformedDayEvent,
  ): boolean => {
    const e1 = getEventMinutes(event1)
    const e2 = getEventMinutes(event2)
    return e1.start < e2.end && e2.start < e1.end
  }

  const getEventPositions = (): Map<string, EventPosition> => {
    const positions = new Map<string, EventPosition>()
    const sortedEvents = [...events].sort((a, b) => {
      return getEventMinutes(a).start - getEventMinutes(b).start
    })

    // Assign each event to a column where it doesn't overlap
    const columns: TransformedDayEvent[][] = []

    sortedEvents.forEach((event) => {
      let placed = false

      for (const column of columns) {
        const hasOverlap = column.some((e) => eventsOverlap(e, event))

        if (!hasOverlap) {
          column.push(event)
          placed = true
          break
        }
      }

      if (!placed) {
        columns.push([event])
      }
    })

    // Calculate width per column as percentage of available space (after time labels)
    const totalColumns = columns.length
    const columnWidth = 100 / totalColumns

    columns.forEach((column, columnIndex) => {
      column.forEach((event) => {
        const minutes = getEventMinutes(event)
        const duration = minutes.end - minutes.start

        positions.set(event.id, {
          height: (duration / 60) * HOUR_HEIGHT,
          left: columnIndex * columnWidth,
          top: (minutes.start / 60) * HOUR_HEIGHT,
          width: columnWidth,
        })
      })
    })

    return positions
  }

  const TIME_LABEL_WIDTH = 55

  // Calculate current time line position
  const getCurrentTimePosition = (): number => {
    const minutes = currentTime.hour() * 60 + currentTime.minute()
    return (minutes / 60) * HOUR_HEIGHT
  }

  // Check if current time line should be shown (only today)
  const isToday = selectedDate.isSame(currentTime, 'day')

  const eventPositions = getEventPositions()

  // Auto-scroll to current time when day changes or on initial load
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
  }, [selectedDay.date, isLoadingEvents, currentTime])

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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack
        borderRadius={2}
        direction="row"
        gap={1}
        height="100%"
        overflow="hidden"
        width="100%"
      >
        {/* Day View - Left Side */}
        <Stack
          bgcolor="common.white"
          border={1}
          borderRadius={2}
          flex={1}
          height="100%"
          ref={scrollContainerRef}
          sx={{
            borderColor: 'divider',
            overflowY: 'auto',
            position: 'relative',
          }}
        >
          {/* Time labels */}
          <Stack
            sx={{
              left: 0,
              position: 'absolute',
              top: 0,
              zIndex: 2,
            }}
          >
            {hours.map((hour) => (
              <Stack
                key={hour}
                sx={{
                  height: HOUR_HEIGHT,
                  justifyContent: 'flex-start',
                  p: 1,
                }}
              >
                <Typography
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                  variant="body2"
                >
                  {formatHour(hour)}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Calendar grid */}
          <Stack
            sx={{
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

            {/* Events */}
            {events.map((event) => {
              const position = eventPositions.get(event.id)
              if (!position) return null

              return (
                <Stack
                  borderLeft={8}
                  key={event.id}
                  onClick={() => setSelectedEvent(event.original)}
                  overflow="hidden"
                  sx={{
                    '&:hover': { opacity: 0.8 },
                    bgcolor: event.color,
                    borderColor: darken(event.color, 0.3),
                    borderRadius: 1,
                    color: 'white',
                    cursor: 'pointer',
                    height: position.height,
                    left: `calc(${TIME_LABEL_WIDTH}px + (100% - ${TIME_LABEL_WIDTH}px) * ${position.left / 100})`,
                    opacity: event.original.meetingSession ? 1 : 0.5,
                    p: 1,
                    position: 'absolute',
                    top: position.top,
                    width: `calc((100% - ${TIME_LABEL_WIDTH}px) * ${position.width / 100} - 4px)`,
                  }}
                >
                  <Stack
                    sx={{
                      alignItems: 'center',
                      flexDirection: 'row',
                      gap: 0.5,
                    }}
                  >
                    <Typography variant="caption">
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

                    <Typography fontWeight={600} variant="caption">
                      {event.title}
                    </Typography>
                  </Stack>
                </Stack>
              )
            })}

            {/* Current time line */}
            {isToday && (
              <Box
                sx={{
                  '&::before': {
                    bgcolor: 'error.light',
                    borderRadius: '50%',
                    content: '""',
                    height: 10,
                    left: 0,
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 10,
                  },
                  bgcolor: 'error.light',
                  height: 2,
                  left: 10,
                  position: 'absolute',
                  right: 0,
                  top: getCurrentTimePosition(),
                  zIndex: 3,
                }}
              />
            )}
          </Stack>
        </Stack>

        {/* Calendar - Right Side */}
        <Stack
          bgcolor="common.white"
          border={1}
          borderRadius={2}
          height="100%"
          sx={{
            borderColor: 'divider',
          }}
          width="320px"
        >
          <DateCalendar
            onChange={(newValue: Dayjs | null) => {
              if (newValue) {
                const newDate = newValue.tz(userTimezone)
                setSelectedDate(newDate)
                setSelectedDay({ date: newDate.format('YYYY-MM-DD') })
              }
            }}
            timezone={userTimezone}
            value={selectedDate}
          />
        </Stack>
      </Stack>
    </LocalizationProvider>
  )
}
