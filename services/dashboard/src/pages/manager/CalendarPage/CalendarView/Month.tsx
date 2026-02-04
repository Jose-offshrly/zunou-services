import { Circle, CircleOutlined } from '@mui/icons-material'
import { alpha, Divider, Stack, Typography } from '@mui/material'
import { Event as RawEventType } from '@zunou-graphql/core/graphql'
import { useGetEventInstances } from '@zunou-queries/core/hooks/useGetEventInstances'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { theme } from '@zunou-react/services/Theme'
import dayjs, { Dayjs } from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { getEventColor } from '~/utils/event'

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

interface TransformedMonthEvent {
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

interface Props {
  selectedMonth: number
  selectedYear: number
  setSelectedEvent: (event: RawEventType) => void
}

export default function Month({
  selectedMonth: initialSelectedMonth,
  selectedYear,
  setSelectedEvent,
}: Props) {
  const { pulseId, organizationId } = useParams()
  const { user } = useAuthContext()
  const userTimezone = user?.timezone ?? 'UTC'

  const [currentTime, setCurrentTime] = useState(() => dayjs().tz(userTimezone))
  const [selectedMonth, setSelectedMonth] = useState(() =>
    dayjs()
      .tz(userTimezone)
      .month(initialSelectedMonth)
      .year(selectedYear)
      .startOf('month'),
  )

  // Update selected month when props change
  useEffect(() => {
    setSelectedMonth(
      dayjs()
        .tz(userTimezone)
        .month(initialSelectedMonth)
        .year(selectedYear)
        .startOf('month'),
    )
  }, [initialSelectedMonth, selectedYear, userTimezone])

  // For fetching events, use the actual month start/end
  const monthStartDate = selectedMonth.startOf('month')
  const monthEndDate = selectedMonth.endOf('month')

  const {
    data: rawEvents,
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useGetEventInstances({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(organizationId && pulseId && user?.id),
    variables: {
      dateRange: [
        monthStartDate.format('YYYY-MM-DD'),
        monthEndDate.format('YYYY-MM-DD'),
      ],
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

  // Transform raw events to month events with timezone awareness
  const events: TransformedMonthEvent[] = (rawEvents?.eventInstances ?? [])
    .map((instance) => {
      const event = instance.event

      if (!event) return null

      const startDate = dayjs(event.start_at).tz(userTimezone)
      const endDate = dayjs(event.end_at).tz(userTimezone)

      return {
        color: getEventColor(event.id, event.priority ?? undefined),
        date: startDate.format('YYYY-MM-DD'),
        endHour: endDate.hour(),
        endMinute: endDate.minute(),
        id: event.id,
        original: event,
        startHour: startDate.hour(),
        startMinute: startDate.minute(),
        title: event.name,
      }
    })
    .filter(Boolean) as TransformedMonthEvent[]

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs().tz(userTimezone))
    }, 60000)
    return () => clearInterval(interval)
  }, [userTimezone])

  // Get calendar grid for the month (includes days from previous/next month to fill the grid)
  const getCalendarDays = (): Dayjs[] => {
    const startOfMonth = selectedMonth.startOf('month')
    const endOfMonth = selectedMonth.endOf('month')
    const startOfCalendar = startOfMonth.startOf('week')
    const endOfCalendar = endOfMonth.endOf('week')

    const days: Dayjs[] = []
    let currentDay = startOfCalendar

    while (
      currentDay.isBefore(endOfCalendar) ||
      currentDay.isSame(endOfCalendar, 'day')
    ) {
      days.push(currentDay)
      currentDay = currentDay.add(1, 'day')
    }

    return days
  }

  const getEventsForDate = (date: Dayjs): TransformedMonthEvent[] => {
    const dateStr = date.format('YYYY-MM-DD')
    return events
      .filter((event) => event.date === dateStr)
      .sort((a, b) => {
        // Sort by start hour first, then by start minute
        if (a.startHour !== b.startHour) {
          return a.startHour - b.startHour
        }
        return a.startMinute - b.startMinute
      })
  }

  const formatTime = (hour: number, minute: number): string => {
    const hourStr = hour === 0 ? '12' : hour > 12 ? `${hour - 12}` : `${hour}`
    const period = hour < 12 ? 'AM' : 'PM'
    if (minute === 0) {
      return `${hourStr} ${period}`
    }
    return `${hourStr}:${minute.toString().padStart(2, '0')}${period}`
  }

  const isToday = (day: Dayjs): boolean => {
    return day.isSame(currentTime, 'day')
  }

  const isCurrentMonth = (day: Dayjs): boolean => {
    return day.isSame(selectedMonth, 'month')
  }

  const isSunday = (day: Dayjs): boolean => {
    return day.format('dddd') === 'Sunday'
  }

  const calendarDays = getCalendarDays()
  const weeks = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
      bgcolor="#f5f5f5"
      border={1}
      borderRadius={2}
      height="100vh"
      sx={{ borderColor: 'divider', overflow: 'hidden' }}
      width="100%"
    >
      {/* Days of week header */}
      <Stack
        bgcolor="white"
        borderBottom={1}
        direction="row"
        sx={{ borderColor: 'divider', flexShrink: 0 }}
      >
        {weekdays.map((day, index) => (
          <>
            <Stack
              alignItems="center"
              bgcolor={day === 'Sun' ? 'grey.50' : undefined}
              flex={1}
              key={day}
              py={1}
            >
              <Typography
                color="text.secondary"
                sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                variant="caption"
              >
                {day.toUpperCase()}
              </Typography>
            </Stack>
            {index < weekdays.length - 1 && (
              <Divider flexItem={true} orientation="vertical" />
            )}
          </>
        ))}
      </Stack>

      {/* Calendar Grid */}
      <Stack flex={1} sx={{ overflowY: 'auto' }}>
        {weeks.map((week, weekIndex) => (
          <Stack
            direction="row"
            flex={1}
            key={weekIndex}
            sx={{ minHeight: 120 }}
          >
            {week.map((day, dayIndex) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentDay = isToday(day)
              const isInCurrentMonth = isCurrentMonth(day)
              const isTodaySunday = isSunday(day)

              return (
                <Stack
                  borderBottom={weekIndex < weeks.length - 1 ? 1 : 0}
                  borderRight={dayIndex < 6 ? 1 : 0}
                  flex={1}
                  key={dayIndex}
                  py={0.5}
                  sx={{
                    alignItems: 'center',
                    bgcolor: isTodaySunday ? 'grey.50' : 'white',
                    borderColor: 'divider',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day number - only show if in current month */}
                  {isInCurrentMonth && (
                    <Typography
                      sx={{
                        alignItems: 'center',
                        bgcolor: isCurrentDay
                          ? alpha(theme.palette.error.light, 0.8)
                          : 'transparent',
                        borderRadius: '50%',
                        color: isCurrentDay ? 'common.white' : 'text.primary',
                        display: 'flex',
                        fontWeight: isCurrentDay ? 600 : 400,
                        height: 20,
                        justifyContent: 'center',
                        mb: 0.5,
                        width: 20,
                      }}
                      variant="caption"
                    >
                      {day.format('D')}
                    </Typography>
                  )}

                  {/* Events - only show if in current month */}
                  {isInCurrentMonth && (
                    <Stack
                      gap={0.5}
                      p={1}
                      sx={{
                        '&::-webkit-scrollbar': {
                          width: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          '&:hover': {
                            backgroundColor: alpha('#000', 0.3),
                          },
                          backgroundColor: alpha('#000', 0.2),
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-track': {
                          backgroundColor: 'transparent',
                        },
                        flex: 1,
                        overflowX: 'hidden',
                        overflowY: 'auto',
                      }}
                      width="100%"
                    >
                      {dayEvents.map((event) => (
                        <Stack
                          key={event.id}
                          onClick={() => setSelectedEvent(event.original)}
                          overflow="hidden"
                          sx={{
                            '&:hover': {
                              bgcolor: 'grey.100',
                            },
                            alignItems: 'center',
                            borderRadius: 0.5,
                            cursor: 'pointer',
                            flexDirection: 'row',
                            flexShrink: 0,
                            gap: 0.5,
                            opacity: event.original.meetingSession ? 1 : 0.5,
                            overflow: 'hidden',
                            px: 0.5,
                            py: 0.25,
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
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
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            variant="caption"
                          >
                            {formatTime(event.startHour, event.startMinute)}{' '}
                            {event.title}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )
            })}
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
