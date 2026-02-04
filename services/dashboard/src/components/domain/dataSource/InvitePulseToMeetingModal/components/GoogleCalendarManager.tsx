import { ArrowBackIosOutlined, UpdateOutlined } from '@mui/icons-material'
import { Box, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useFetchUserCalendarSourcedEventsMutation } from '@zunou-queries/core/hooks/useFetchUserCalendarSourcedEventsMutation'
import { useGetEventInstances } from '@zunou-queries/core/hooks/useGetEventInstances'
import googleCalendarIcon from '@zunou-react/assets/images/google-calendar-icon.png'
import { Button, LoadingButton } from '@zunou-react/components/form'
import Avatar from '@zunou-react/components/utility/Avatar'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs, { Dayjs } from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { LoadingSpinner } from '~/components/ui/LoadingSpinner'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'

import { InvitePulseModalMode } from '..'
import { DateRange } from './DateRangePicker'
import { EventWithInstanceId } from './EventMeeting'
import { MeetingList } from './MeetingList'
import { MeetingsToolbar } from './MeetingsToolbar'

interface GoogleCalendarManagerProps {
  isVitalsMode: boolean
  setModalMode: (modalMode: InvitePulseModalMode) => void
  isGoogleCalendarOnlyMode?: boolean
}

const STORAGE_KEY = 'google_meetings_date_range'

const GoogleCalendarManager = ({
  isVitalsMode,
  setModalMode,
  isGoogleCalendarOnlyMode = false,
}: GoogleCalendarManagerProps) => {
  const queryClient = useQueryClient()
  const { user } = useAuthContext()
  const { organizationId } = useOrganization()
  const { pulseId } = useParams<{ pulseId: string }>()

  const timezone = user?.timezone ?? 'UTC'

  const [searchQuery, setSearchQuery] = useState('')
  const initialRange = useMemo(getInitialRange, [])

  const [startDate, setStartDate] = useState<Dayjs | null>(
    initialRange.startDate,
  )
  const [endDate, setEndDate] = useState<Dayjs | null>(initialRange.endDate)

  const [isSyncing, setIsSyncing] = useState(false)

  const { mutateAsync: fetchUserCalendarEvents } =
    useFetchUserCalendarSourcedEventsMutation({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    })

  const {
    data: eventsData,
    isLoading: isLoadingEventsData,
    refetch: refetchEventsData,
  } = useGetEventInstances({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    variables: {
      dateRange: [startDate, endDate],
      organizationId,
      pulseId,
      userId: user?.id,
    },
  })

  const handleSelectDateRange = ({ start, end }: DateRange) => {
    const newStart = start?.tz(timezone).startOf('day') ?? null
    const newEnd = end?.tz(timezone).endOf('day') ?? null

    const hasChanged =
      (newStart && !newStart.isSame(startDate)) ||
      (newEnd && !newEnd.isSame(endDate))

    if (hasChanged) {
      setStartDate(newStart)
      setEndDate(newEnd)

      if (newStart && newEnd) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            end: newEnd.toISOString(),
            start: newStart.toISOString(),
          }),
        )
      }
    }
  }

  const filteredCalendarEvents = useMemo((): EventWithInstanceId[] => {
    if (!eventsData || !pulseId) return []

    // Exclude collaboration meetings in Google Calendar
    const excludePattern = /^\[.+ - \d+\] Collaboration Meet$/

    return eventsData.eventInstances
      .map((eventInstance) => ({
        ...eventInstance.event,
        eventInstanceId: eventInstance.id,
      }))
      .filter(
        (event) =>
          event != null &&
          event.date != null &&
          event.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !excludePattern.test(event.name) &&
          !event.meetingSession,
      ) as EventWithInstanceId[]
  }, [eventsData, pulseId, searchQuery])

  const handleSync = useCallback(async () => {
    try {
      setIsSyncing(true)

      await toast.promise(
        fetchUserCalendarEvents({ organizationId, pulseId }),
        {
          error: 'Failed to sync. Please try again.',
          loading: 'Syncing your Google Calendar…',
          success:
            'Sync started! It may take a few minutes for data to reflect.',
        },
      )
    } catch (err) {
      console.error('Sync error:', err)
    }
  }, [pulseId, organizationId])

  // Temporarily removed
  // useEffect(() => {
  //   handleSync()
  // }, [handleSync])

  const handleCalendarSyncCompleted = useCallback(() => {
    refetchEventsData()
    setIsSyncing(false)
    toast.success('Synced successfully')
  }, [queryClient, organizationId])

  usePusherChannel({
    channelName:
      organizationId && `calendar-sync.organization.${organizationId}`,
    eventName: '.google-calendar-sync-completed',
    onEvent: handleCalendarSyncCompleted,
  })

  return (
    <Stack height="100%" width="100%">
      {/* Header */}
      <Stack
        alignItems="center"
        borderBottom={1}
        borderColor="divider"
        direction="row"
        gap={2}
        justifyContent={isGoogleCalendarOnlyMode ? 'flex-end' : 'space-between'}
        px={2}
        py={3}
      >
        {!isGoogleCalendarOnlyMode && (
          <Button
            onClick={() => setModalMode(InvitePulseModalMode.Default)}
            startIcon={
              <ArrowBackIosOutlined
                fontSize="small"
                sx={{ color: 'text.secondary' }}
              />
            }
            sx={{ color: 'text.secondary' }}
          >
            Back
          </Button>
        )}

        <Stack alignItems="center" direction="row" gap={3} justifyContent="end">
          <Stack alignItems="center" direction="row" gap={2}>
            <Stack position="relative">
              <Avatar
                placeholder={user?.name}
                size="small"
                src={user?.gravatar || user?.picture || undefined}
                variant="circular"
              />
              <Box
                bottom={0}
                height={15}
                position="absolute"
                right={-5}
                width={15}
              >
                <img
                  alt="Google Calendar Icon"
                  height="100%"
                  src={googleCalendarIcon}
                  width="100%"
                />
              </Box>
            </Stack>
            <Stack>
              <Typography fontWeight="600">{user?.name}</Typography>
              <Typography variant="caption">{user?.email}</Typography>
            </Stack>
          </Stack>

          <LoadingButton
            loading={isSyncing}
            onClick={handleSync}
            startIcon={<UpdateOutlined fontSize="small" />}
            variant="outlined"
          >
            Sync
          </LoadingButton>
        </Stack>
      </Stack>

      {/* Content */}
      <Stack flex={1} minHeight={0} py={2} spacing={2}>
        <Box>
          <MeetingsToolbar
            endDate={endDate}
            isVitalsMode={isVitalsMode}
            onDateRangeChange={handleSelectDateRange}
            onSearchChange={setSearchQuery}
            searchQuery={searchQuery}
            startDate={startDate}
          />
        </Box>

        {isLoadingEventsData ? (
          <Stack
            alignItems="center"
            direction="row"
            flex={1}
            gap={1}
            justifyContent="center"
            width="100%"
          >
            <LoadingSpinner />
            <Typography variant="subtitle2">Fetching Meetings</Typography>
          </Stack>
        ) : (
          <MeetingList
            googleCalendarMeetings={filteredCalendarEvents}
            isGoogleCalMode={true}
            isVitalsMode={isVitalsMode}
          />
        )}
      </Stack>
    </Stack>
  )
}

const getInitialRange = (): { startDate: Dayjs; endDate: Dayjs } => {
  const saved = sessionStorage.getItem(STORAGE_KEY)

  if (saved) {
    try {
      const { start, end } = JSON.parse(saved) as {
        start: string
        end: string
      }

      if (start && end) {
        return {
          endDate: dayjs(end).endOf('day'),
          startDate: dayjs(start).startOf('day'),
        }
      }
    } catch {
      // ignore malformed data
    }
  }

  return {
    endDate: dayjs().endOf('day'),
    startDate: dayjs().startOf('day'),
  }
}

export default GoogleCalendarManager
