import { FreeBreakfast, Home, Schedule } from '@mui/icons-material'
import { alpha, Box, CircularProgress, Stack, Typography } from '@mui/material'
import { Event } from '@zunou-graphql/core/graphql'
import { theme } from '@zunou-react/services/Theme'
import { useEffect } from 'react'
import { useInView } from 'react-intersection-observer'

import EventItem from './EventItem'

export type EventOrBreak =
  | { type: 'event'; data: Event }
  | { type: 'break'; data: { minutes: number } }
  | {
      type: 'week-header'
      data: { startDate: string; count: number }
    }

interface EventsListProps {
  items: EventOrBreak[]
  isLoading?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  fetchNextPage?: () => void
  onEventClick?: (eventId: string) => void
  pastOrUpcomingEvents?: boolean
}

const TimelineDots = () => (
  <Stack alignItems="center" spacing={0.5}>
    {[1, 2, 3].map((dot) => (
      <Box
        key={dot}
        sx={{
          backgroundColor: theme.palette.primary.main,
          borderRadius: '50%',
          height: 4,
          width: 4,
        }}
      />
    ))}
  </Stack>
)

const WeekHeader = ({
  startDate,
  count,
}: {
  startDate: string
  count: number
}) => {
  return (
    <Stack alignItems="center" direction="row" spacing={2}>
      <Typography color="black" variant="h6">
        {startDate}
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {count} {count === 1 ? 'meeting' : 'meetings'}
      </Typography>
    </Stack>
  )
}

const BreakItem = ({ minutes }: { minutes?: number }) => {
  const getBreakLabel = () => {
    if (!minutes) return "You've wrapped up Today. Time to head home"
    if (minutes < 15) return 'Short break'
    if (minutes < 60) return `${Math.round(minutes)} min break`
    const hours = Math.floor(minutes / 60)
    const remainingMins = Math.round(minutes % 60)
    return remainingMins > 0
      ? `${hours}h ${remainingMins}m break --grab a coffee`
      : `${hours}h break —grab a coffee`
  }

  return (
    <Stack alignItems="center" spacing={1}>
      <TimelineDots />
      <Box
        sx={{
          alignItems: 'center',
          backgroundColor: 'transparent',
          border: `1px solid ${theme.palette.grey[300]}`,
          borderRadius: '12px',
          display: 'flex',
          gap: 1,
          justifyContent: 'center',
          p: 1.5,
        }}
      >
        {minutes ? (
          <FreeBreakfast
            sx={{
              color: alpha(theme.palette.primary.main, 0.6),
              fontSize: 18,
            }}
          />
        ) : (
          <Home
            sx={{
              color: alpha(theme.palette.primary.main, 0.6),
              fontSize: 18,
            }}
          />
        )}
        <Typography
          sx={{
            color: alpha(theme.palette.primary.main, 0.6),
          }}
          variant="body2"
        >
          {getBreakLabel()}
        </Typography>
      </Box>

      {minutes && <TimelineDots />}
    </Stack>
  )
}

export const EventsList = ({
  items,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  onEventClick,
  pastOrUpcomingEvents,
}: EventsListProps) => {
  const { ref, inView } = useInView() // used for checking if the user has reached the end of the list

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage?.()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={4}>
        <CircularProgress size={32} />
      </Stack>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Stack alignItems="center" py={4} spacing={2}>
        <Schedule sx={{ color: theme.palette.text.secondary, fontSize: 64 }} />
        <Typography color="text.secondary" variant="body1">
          No events scheduled
        </Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      {items.map((item, index) => {
        if (item.type === 'break') {
          return (
            <BreakItem key={`break-${index}`} minutes={item.data.minutes} />
          )
        }
        if (item.type === 'week-header') {
          return (
            <WeekHeader
              count={item.data.count}
              key={`week-${index}`}
              startDate={item.data.startDate}
            />
          )
        }
        return (
          <EventItem
            event={item.data}
            key={item.data.id}
            onClick={() => onEventClick?.(item.data.id)}
          />
        )
      })}
      {!pastOrUpcomingEvents && <BreakItem />}

      {/* sentinel element for infinite scroll */}
      <Box ref={ref} sx={{ height: '1px', width: '100%' }} />

      {isFetchingNextPage && (
        <Stack alignItems="center" py={2}>
          <CircularProgress size={24} />
        </Stack>
      )}
    </Stack>
  )
}

export default EventsList
