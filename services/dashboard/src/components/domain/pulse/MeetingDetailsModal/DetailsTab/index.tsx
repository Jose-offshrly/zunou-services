import { Stack } from '@mui/material'
import { MeetingSessionStatus } from '@zunou-graphql/core/graphql'
import { useGetEvent } from '@zunou-queries/core/hooks/useGetEvent'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'

import { useMeetingPulse } from '~/components/domain/dataSource/InvitePulseToMeetingModal/components/Meeting'

import Loader from '../Loader'
import { AddEventToPulseSection } from './AddEventToPulseSection'
import { MeetingHeader } from './MeetingHeader'
import { ParticipantsSection } from './ParticipantsSection'
import { PrioritySection } from './PrioritySection'
import { PulseCompanionSection } from './PulseCompanionSection'
import { SummarySection } from './SummarySection'

interface DetailsTabProps {
  eventId: string
}

export default function DetailsTab({ eventId }: DetailsTabProps) {
  const { organizationId, pulseId } = useParams()

  const {
    data: eventData,
    isLoading,
    refetch: refetchEventData,
  } = useGetEvent({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
    enabled: !!eventId,
    variables: {
      eventId,
    },
  })

  const event = eventData?.event
  const meetingSession = event?.meetingSession
  const hasMeetingSession = !!meetingSession

  const { control, watch, reset } = useForm({
    defaultValues: {
      invitePulse: false,
    },
  })

  const meetingPulse = useMeetingPulse(meetingSession?.id)
  const invitePulseValue = watch('invitePulse')
  const prevInvitePulseRef = useRef<boolean | null>(null)
  const isInitializingRef = useRef(true)

  // Reset form when meeting session data loads
  useEffect(() => {
    if (meetingSession?.invite_pulse !== undefined) {
      isInitializingRef.current = true
      reset({ invitePulse: meetingSession.invite_pulse })
      prevInvitePulseRef.current = meetingSession.invite_pulse
      // Use setTimeout to ensure the reset completes before allowing updates
      setTimeout(() => {
        isInitializingRef.current = false
      }, 0)
    }
  }, [meetingSession?.invite_pulse, reset])

  useEffect(() => {
    // Skip if initializing or no initial value set
    if (isInitializingRef.current || prevInvitePulseRef.current === null) {
      return
    }

    if (invitePulseValue !== prevInvitePulseRef.current) {
      meetingPulse.updateInvitePulseStatus(invitePulseValue)
      prevInvitePulseRef.current = invitePulseValue
    }
  }, [invitePulseValue, meetingPulse])

  const handleJoin = () => {
    const url = meetingSession?.meetingUrl ?? event?.link
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Callback when a meeting session is created - refetch event to get updated data
  const handleMeetingSessionCreated = (_meetingSessionId: string) => {
    refetchEventData()
  }

  if (isLoading) return <Loader />

  return (
    <Stack gap={2} height="100%" width="100%">
      <MeetingHeader
        event={event ?? undefined}
        onJoin={handleJoin}
        refetch={refetchEventData}
      />

      <Stack gap={2}>
        {hasMeetingSession ? (
          <PulseCompanionSection
            control={control}
            isDisabled={meetingPulse.isUpdateInvitePulsePending}
            isLive={
              meetingSession?.status === MeetingSessionStatus.Active ||
              meetingSession?.status === MeetingSessionStatus.Paused
            }
          />
        ) : (
          <AddEventToPulseSection
            event={event ?? undefined}
            onMeetingSessionCreated={handleMeetingSessionCreated}
          />
        )}

        <PrioritySection
          eventId={event?.id}
          initialPriority={event?.priority ?? null}
        />

        <ParticipantsSection participants={event?.participants} />

        <SummarySection
          eventId={eventId}
          existingSummary={event?.summary}
          meetingSessionId={meetingSession?.id}
          organizationId={organizationId}
          pulseId={pulseId}
        />
      </Stack>
    </Stack>
  )
}
