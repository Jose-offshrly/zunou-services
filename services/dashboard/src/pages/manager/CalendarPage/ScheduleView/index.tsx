import { Stack } from '@mui/material'
import { useGetInfiniteEvents } from '@zunou-queries/core/hooks/useGetInfiniteEvents'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

// Extend dayjs with timezone support
dayjs.extend(utc)
dayjs.extend(timezone)

import { EventSortOrder } from '@zunou-graphql/core/graphql'

import EventDetailsModal from '~/components/domain/pulse/EventDetailsModal'
import { usePusherChannel } from '~/hooks/usePusherChannel'

import { ScheduleFilter } from '..'
import EventsList, { EventOrBreak } from './EventsList'

export default function ScheduleView({
  scheduleFilter,
  searchQuery,
  newlyCreatedEventId,
  onNewEventHandled,
}: {
  scheduleFilter: ScheduleFilter
  searchQuery: string
  newlyCreatedEventId: string | null
  onNewEventHandled: () => void
}) {
  const { user } = useAuthContext()
  const { organizationId, pulseId } = useParams<{
    organizationId: string
    pulseId: string
  }>()
  const userTimezone: string = user?.timezone ?? 'UTC'

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)

  // Date range and sort order for getting events based on the active filter
  const { dateRange, sortOrder } = useMemo(() => {
    const now = dayjs().tz(userTimezone)

    switch (scheduleFilter) {
      // today's events
      case 'schedule': {
        const startOfDay = now.startOf('day').toISOString()
        const endOfDay = now.endOf('day').toISOString()
        return {
          dateRange: [startOfDay, endOfDay],
          sortOrder: EventSortOrder.Asc,
        }
      }
      // upcoming events up to 1 year from now
      case 'upcoming': {
        const oneYearFromNow = now.add(1, 'year').toISOString()
        return {
          dateRange: [now.toISOString(), oneYearFromNow],
          sortOrder: EventSortOrder.Asc,
        }
      }
      // past events: 1 year ago to now
      case 'past': {
        const oneYearAgo = now.subtract(1, 'year').toISOString()
        return {
          dateRange: [oneYearAgo, now.toISOString()],
          sortOrder: EventSortOrder.Desc,
        }
      }
      // no filter, events 1 year ago to 1 year from now
      default:
        return {
          dateRange: [
            now.subtract(1, 'year').toISOString(),
            now.add(1, 'year').toISOString(),
          ],
          sortOrder: EventSortOrder.Desc,
        }
    }
  }, [scheduleFilter, userTimezone])

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetInfiniteEvents({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      dateRange,
      organizationId,
      perPage: 50,
      pulseId,
      sortOrder,
      userId: user?.id,
    },
  })

  usePusherChannel({
    channelName:
      organizationId && `calendar-sync.organization.${organizationId}`,
    eventName: '.google-calendar-sync-completed',
    onEvent: refetch,
  })

  // flatten pages data
  const allEvents = useMemo(() => {
    return data?.pages?.flatMap((page) => page.data) ?? []
  }, [data?.pages])

  // Open the meeting details modal when a new event is created
  useEffect(() => {
    if (newlyCreatedEventId) {
      setSelectedEventId(newlyCreatedEventId)
      onNewEventHandled()
    }
  }, [newlyCreatedEventId, onNewEventHandled])

  const selectedEvent = useMemo(
    () => allEvents.find((event) => event.id === selectedEventId),
    [allEvents, selectedEventId],
  )

  const filteredEvents = useMemo(() => {
    const now = dayjs().tz(userTimezone)
    const normalizedQuery = searchQuery.toLowerCase().trim()

    let filtered = allEvents

    // filter upcoming and past events based on time.
    if (scheduleFilter === 'upcoming') {
      filtered = filtered.filter((event) => {
        const eventStart = dayjs(event.start_at).tz(userTimezone)
        return eventStart.isAfter(now)
      })
    } else if (scheduleFilter === 'past') {
      filtered = filtered.filter((event) => {
        const eventEnd = dayjs(event.end_at).tz(userTimezone)
        return eventEnd.isBefore(now)
      })
    }

    // filter by search query
    if (normalizedQuery) {
      filtered = filtered.filter((event) =>
        event.name.toLowerCase().includes(normalizedQuery),
      )
    }
    return filtered
  }, [allEvents, searchQuery, scheduleFilter, userTimezone])

  const eventsWithBreaks = (() => {
    // Group past events by week
    if (scheduleFilter === 'past') {
      const items: EventOrBreak[] = []
      const weekGroups = new Map<string, typeof filteredEvents>()

      // group events by week
      filteredEvents.forEach((event) => {
        const eventDate = dayjs(event.start_at).tz(userTimezone)
        const weekStart = eventDate.startOf('week')
        const weekKey = weekStart.format('YYYY-MM-DD')

        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, [])
        }
        weekGroups.get(weekKey)!.push(event)
      })

      // list of events with week headers to specify the week range
      weekGroups.forEach((events, weekKey) => {
        const weekStart = dayjs(weekKey).tz(userTimezone)
        const weekEnd = weekStart.endOf('week')

        let dateRange: string
        // if start and end days of a week have different years, indicate the year
        if (weekStart.year() !== weekEnd.year()) {
          dateRange = `${weekStart.format('MMMM D, YYYY')} - ${weekEnd.format('MMMM D, YYYY')}`
        } else if (weekStart.month() !== weekEnd.month()) {
          // same year, different months
          dateRange = `${weekStart.format('MMMM D')} - ${weekEnd.format('MMMM D')}`
        } else {
          // same month
          dateRange = `${weekStart.format('MMMM D')}-${weekEnd.format('D')}`
        }

        items.push({
          data: {
            count: events.length,
            startDate: dateRange,
          },
          type: 'week-header',
        })

        events.forEach((event) => {
          items.push({ data: event, type: 'event' })
        })
      })

      return items
    }

    // Don't calculate breaks for upcoming events
    if (scheduleFilter === 'upcoming') {
      return filteredEvents.map((event) => ({
        data: event,
        type: 'event' as const,
      }))
    }

    const items: EventOrBreak[] = []

    filteredEvents.forEach((event, index) => {
      items.push({ data: event, type: 'event' })

      // calculate break minutes if two events have time in between
      if (index < filteredEvents.length - 1) {
        const currentEnd = new Date(event.end_at)
        const nextStart = new Date(filteredEvents[index + 1].start_at)
        const breakMinutes =
          (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60)

        if (breakMinutes > 0) {
          items.push({ data: { minutes: breakMinutes }, type: 'break' })
        }
      }
    })

    return items
  })()

  return (
    <Stack
      sx={{
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        msOverflowStyle: 'none',
        overflow: 'auto',
        scrollbarWidth: 'none',
        width: '100%',
      }}
    >
      <EventsList
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        items={eventsWithBreaks}
        onEventClick={(eventId) => setSelectedEventId(eventId)}
        pastOrUpcomingEvents={
          scheduleFilter === 'past' || scheduleFilter === 'upcoming'
        }
      />

      <EventDetailsModal
        dataSourceId={
          selectedEvent?.meetingSession?.dataSource?.id ?? undefined
        }
        eventId={selectedEventId}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEventId(null)}
      />

      {/* Modal to show after even item is clicked: If data source is available, show meeting overview. else, show meeting details modal */}
      {/* {selectedEvent &&
        (selectedEvent?.meetingSession?.dataSource?.id ? (
          <MeetingDetails
            dataSourceId={selectedEvent?.meetingSession.dataSource.id}
            isOpen={Boolean(selectedEvent)}
            onClose={() => setSelectedEventId(null)}
            onDelete={handleDeleteDataSource}
          />
        ) : (
          <MeetingDetailsModal
            eventId={selectedEventId}
            isOpen={Boolean(selectedEvent)}
            meetingSessionId={selectedEvent?.meetingSession?.id ?? null}
            onClose={() => setSelectedEventId(null)}
            useEventIdForQuery={
              selectedEvent?.meetingSession?.id ? false : true
            }
          />
        ))} */}
    </Stack>
  )
}
