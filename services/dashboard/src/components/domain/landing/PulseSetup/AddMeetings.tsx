import { Refresh } from '@mui/icons-material'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
import {
  Event,
  MeetingSessionType,
  PulseCategory,
} from '@zunou-graphql/core/graphql'
import { useCreateMeetingSessionMutation } from '@zunou-queries/core/hooks/useCreateMeetingSessionMutation'
import { useFetchUserCalendarSourcedEventsMutation } from '@zunou-queries/core/hooks/useFetchUserCalendarSourcedEventsMutation'
import { useGetEventInstances } from '@zunou-queries/core/hooks/useGetEventInstances'
import { useGetPulsesQuery } from '@zunou-queries/core/hooks/useGetPulsesQuery'
import { IconButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'

import { PulseSetupLayout } from '~/components/layouts'
import { LoadingSkeleton } from '~/components/ui/LoadingSkeleton'
import { useOrganization } from '~/hooks/useOrganization'
import { usePusherChannel } from '~/hooks/usePusherChannel'
import { getMeetingStatus } from '~/utils/meetingUtils'

import { EventWithInstanceId } from '../../dataSource/InvitePulseToMeetingModal/components/EventMeeting'
import LandingButton from '../LandingButton'
import EventCard from './EventCard'
import { FinishModal } from './FinishModal'

interface Props {
  currentStep: number
  totalSteps: number
  nextCallback?: () => Promise<void>
}

const AddMeetings = ({ currentStep, totalSteps, nextCallback }: Props) => {
  const { organizationId } = useOrganization()
  const { user } = useAuthContext()
  const { t } = useTranslation(['onboarding'])

  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [creatingMeetingSessions, setCreatingMeetingSessions] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [ending, setEnding] = useState(false)

  const [displayEvents, setDisplayEvents] = useState<Event[]>([])

  const { data: pulsesData, isLoading: isPulsesDataLoading } =
    useGetPulsesQuery({
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
      variables: { organizationId },
    })

  const { mutateAsync: createMeetingSession } = useCreateMeetingSessionMutation(
    {
      coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    },
  )

  const {
    mutateAsync: fetchUserCalendarEvents,
    isPending: isFetchUserCalendarEventsPending,
  } = useFetchUserCalendarSourcedEventsMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const personalPulseId = useMemo(() => {
    return pulsesData?.pulses.find(
      (pulse) => pulse.category === PulseCategory.Personal,
    )?.id
  }, [pulsesData])

  const timezone = user?.timezone ?? 'UTC'
  const today = dayjs().tz(timezone).format('YYYY-MM-DD')
  const endOfWeek = dayjs().tz(timezone).endOf('week').format('YYYY-MM-DD')

  const {
    data: eventsData,
    isLoading: isLoadingEventsData,
    refetch: refetchEventsData,
  } = useGetEventInstances({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: Boolean(personalPulseId && organizationId && user),
    variables: {
      dateRange: [today, endOfWeek],
      organizationId,
      pulseId: personalPulseId,
      userId: user?.id,
    },
  })

  useEffect(() => {
    console.log('eventsData', eventsData)
  }, [eventsData])

  const excludePattern = /^\[.+ - \d+\] Collaboration Meet$/

  const events = useMemo(
    () =>
      eventsData?.eventInstances
        .map((eventInstance) => ({
          ...eventInstance.event,
          eventInstanceId: eventInstance.id,
        }))
        .filter((event): event is EventWithInstanceId => {
          if (event == null) return false
          if (!event.name) return false
          if (excludePattern.test(event.name)) return false
          if (event.meetingSession) return false

          return true
        }) ?? [],
    [eventsData],
  )

  const addEventId = (eventId: string) => {
    setSelectedEventIds((prev) => {
      if (prev.includes(eventId)) return prev
      return [...prev, eventId]
    })
  }

  const removeEventId = (eventId: string) => {
    setSelectedEventIds((prev) => prev.filter((id) => id !== eventId))
  }

  const onToggleSelect = ({
    id,
    selected,
  }: {
    id: string
    selected: boolean
  }) => {
    if (selected) addEventId(id)
    else removeEventId(id)
  }

  const handleResync = ({
    organizationId,
    pulseId,
  }: {
    organizationId: string
    pulseId: string | null
  }) => {
    if (!pulseId) {
      toast.error(t('missingPulseId', { ns: 'onboarding' }))
      return
    }
    setSyncing(true)
    fetchUserCalendarEvents({ organizationId, pulseId })
  }

  const handleNext = useCallback(
    async (eventIds: string[]) => {
      if (!personalPulseId) {
        toast.error(t('missingPersonalPulseId', { ns: 'onboarding' }))
        return
      }

      setCreatingMeetingSessions(true)

      const selectedEvents = events.filter((event) =>
        eventIds.includes(event.id),
      )

      setDisplayEvents(selectedEvents)

      try {
        const promises = selectedEvents.map(
          ({
            end_at,
            start_at,
            id,
            participants,
            google_event_id,
            link,
            name,
            eventInstanceId,
          }) => {
            const transformedParticipants =
              participants.map((participant) => participant.email || '') || []

            const startDateObj = dayjs.tz(start_at, user?.timezone ?? 'UTC')
            const endDateObj = dayjs.tz(end_at, user?.timezone ?? 'UTC')

            const meetingStatus = getMeetingStatus({
              end: endDateObj,
              start: startDateObj,
              timezone: user?.timezone ?? 'UTC',
            })

            return createMeetingSession(
              {
                attendees: [],
                end_at,
                event_id: id,
                event_instance_id: eventInstanceId,
                external_attendees: transformedParticipants,
                gcal_meeting_id: google_event_id,
                invite_pulse: true,
                meeting_url: link,
                name,
                organizationId,
                pulseId: personalPulseId,
                start_at,
                status: meetingStatus.status,
                type: MeetingSessionType.Meeting,
              },
              {
                onError: (error: unknown) => {
                  console.error(
                    `Failed to create meeting session for "${name}" / "${id}"`,
                    error,
                  )
                  toast.error(
                    `${t('failedToCreateMeetingSession', { ns: 'onboarding' })} "${name}"`,
                  )
                },
              },
            )
          },
        )

        await Promise.all(promises)

        setShowFinishModal(true)
      } finally {
        setCreatingMeetingSessions(false)
      }
    },
    [events, personalPulseId, user, organizationId, setDisplayEvents, t],
  )

  // Reset selected events on events update
  useEffect(() => {
    setSelectedEventIds([])
  }, [events])

  // Sync on mount when personalPulseId is ready
  useEffect(() => {
    if (!personalPulseId) return
    setSyncing(true)
    fetchUserCalendarEvents({ organizationId, pulseId: personalPulseId })
  }, [personalPulseId, organizationId, fetchUserCalendarEvents])

  const handleCalendarSyncCompleted = () => {
    refetchEventsData()
    setSyncing(false)
  }

  usePusherChannel({
    channelName:
      organizationId && `calendar-sync.organization.${organizationId}`,
    eventName: '.google-calendar-sync-completed',
    onEvent: handleCalendarSyncCompleted,
  })

  const isLoading = isLoadingEventsData || syncing || isPulsesDataLoading

  return (
    <>
      <PulseSetupLayout>
        <Stack
          alignItems="center"
          direction="row"
          gap={5}
          height="100%"
          justifyContent="space-between"
          width="100%"
        >
          {/* Left Section */}
          <Stack alignItems="start" gap={2} width={{ lg: '35%', md: '100%' }}>
            <Typography
              color="primary.main"
              fontSize="small"
              textTransform="uppercase"
            >
              {t('step', { ns: 'onboarding' })} {currentStep}{' '}
              {t('of', { ns: 'onboarding' })} {totalSteps}
            </Typography>
            <Typography fontWeight={600} variant="h2">
              {t('chooseMeetingsFor', { ns: 'onboarding' })}{' '}
              <Box color="primary.main" component="span">
                {t('companion', { ns: 'onboarding' })}
              </Box>
            </Typography>
            <Typography>
              {t('companionDescription', { ns: 'onboarding' })}
            </Typography>

            <Stack
              alignItems="center"
              direction="row"
              gap={2}
              justifyContent="space-between"
              width="100%"
            >
              <LandingButton
                disabled={
                  selectedEventIds.length === 0 ||
                  creatingMeetingSessions ||
                  syncing ||
                  isLoadingEventsData
                }
                loading={creatingMeetingSessions}
                onClick={() => handleNext(selectedEventIds)}
              >
                {t('next', { ns: 'onboarding' })}
              </LandingButton>
              <LandingButton
                disabled={ending}
                loading={ending}
                onClick={async () => {
                  setEnding(true)
                  await nextCallback?.()
                  setEnding(false)
                }}
                sx={{ color: 'text.secondary', fontWeight: 700 }}
                variant="text"
              >
                {t('skip', { ns: 'onboarding' })}
              </LandingButton>
            </Stack>
          </Stack>

          {/* Right Section - Form */}
          <Stack
            alignItems="center"
            height={{ md: '80%', sm: '100%' }}
            justifyContent="flex-start"
            width={{ md: '50%', sm: '100%' }}
            zIndex={50}
          >
            <Stack height="100%" maxWidth="500px" width="100%">
              {/* Header */}
              <Stack
                alignItems="center"
                direction="row"
                gap={2}
                justifyContent="space-between"
                mb={2}
              >
                <Typography fontWeight={700}>
                  {t('addPulseCompanionToMeetings', { ns: 'onboarding' })}
                </Typography>
                <IconButton
                  disabled={isFetchUserCalendarEventsPending}
                  onClick={() =>
                    handleResync({
                      organizationId,
                      pulseId: personalPulseId ?? null,
                    })
                  }
                >
                  {syncing ? <CircularProgress size={16} /> : <Refresh />}
                </IconButton>
              </Stack>

              {isLoading ? (
                <Stack gap={2} height="100%">
                  {[1, 2, 3].map((i) => (
                    <LoadingSkeleton
                      height={100}
                      key={i}
                      sx={{ borderRadius: 4 }}
                      width="100%"
                    />
                  ))}
                </Stack>
              ) : events.length === 0 ? (
                <Stack py={2}>
                  <Typography color="text.secondary">
                    {t('youCurrentlyDontHaveEvents', { ns: 'onboarding' })}
                  </Typography>
                </Stack>
              ) : (
                <Stack
                  flex={1}
                  gap={2}
                  sx={{
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    pr: 2,
                  }}
                >
                  {events.map((event) => (
                    <EventCard
                      date={event.date}
                      endTime={event.end_at}
                      id={event.id}
                      key={event.id}
                      name={event.name}
                      numParticipants={event.participants.length}
                      onToggleSelect={onToggleSelect}
                      startTime={event.start_at}
                    />
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        </Stack>
      </PulseSetupLayout>
      <FinishModal
        events={displayEvents}
        isOpen={showFinishModal}
        nextCallback={nextCallback}
      />
    </>
  )
}

export default AddMeetings
