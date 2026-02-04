import { CircularProgress, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  MeetingSessionStatus,
  MeetingSessionType,
  PulseMemberRole,
} from '@zunou-graphql/core/graphql'
import { useUpdateMeetingSessionStatus } from '@zunou-queries/core/hooks/useUpdateMeetingSessionStatus'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { useLiveMeetings } from '~/context/LiveMeetingsContext'
import { usePulseStore } from '~/store/usePulseStore'

import { MeetingDataSourceItem } from '../MeetingDataSourceItem'

interface Props {
  showEmptyPlaceholder?: boolean
}

export const MeetingSessionsList = ({
  showEmptyPlaceholder = false,
}: Props) => {
  const {
    activeCollabs,
    activeMeetings,
    isCollabsLoading,
    isMeetingSessionsLoading,
    meetingSessionsError,
  } = useLiveMeetings()

  const { pulseMembership } = usePulseStore()
  const { pulseId, organizationId } = useParams<{
    pulseId: string
    organizationId: string
  }>()

  const queryClient = useQueryClient()

  const isGuestOrStaff =
    pulseMembership?.role === PulseMemberRole.Guest ||
    pulseMembership?.role === PulseMemberRole.Staff

  const { mutateAsync: updateMeetingStatus } = useUpdateMeetingSessionStatus()

  const handleTogglePlayStatus = async (
    meetingId: string,
    currentStatus: MeetingSessionStatus,
  ) => {
    await updateMeetingStatus(
      {
        id: meetingId,
        status:
          currentStatus === MeetingSessionStatus.Active
            ? MeetingSessionStatus.Paused
            : MeetingSessionStatus.Active,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['collabs', organizationId, pulseId],
          })
        },
      },
    )
  }

  const handleEndMeeting = async (
    meetingId: string,
    type: MeetingSessionType,
  ) => {
    try {
      await updateMeetingStatus({
        id: meetingId,
        status: MeetingSessionStatus.Stopped,
      })

      if (type === MeetingSessionType.Meeting)
        // Invalidate the meeting sessions query to force a re-render
        queryClient.invalidateQueries({
          queryKey: ['meetingSessions', organizationId, pulseId],
        })
      // Force a re-render of the collabOngoing state
      else
        queryClient.invalidateQueries({
          queryKey: ['collabs', organizationId, pulseId],
        })

      toast.success('Meeting ended successfully.')
    } catch (error) {
      console.error('Error ending recording:', error)
      toast.error('Failed to end recording')
    }
  }

  const transformedActiveMeetings = useMemo(
    () =>
      activeMeetings.map((session) => ({
        companionStatus: session.companion_status,
        datetime: new Date(session.start_at || Date.now()),
        id: session.id,
        participants: session.attendees.map(
          (attendee) => attendee?.user.name || attendee?.user.email,
        ),
        pulse: true,
        source: 'meet' as const,
        status: session.status as
          | MeetingSessionStatus.Active
          | MeetingSessionStatus.Paused,
        title: session.name || 'Untitled Meeting',
        type: session.type,
        url: session.meetingUrl,
      })) ?? [],
    [activeMeetings],
  )

  const transformedActiveCollabs = useMemo(
    () =>
      activeCollabs.map((collab) => ({
        ...collab,
        status:
          (collab.status as MeetingSessionStatus.Active) ||
          MeetingSessionStatus.Paused,
      })) ?? [],
    [activeCollabs],
  )

  const hasNoMeetings =
    transformedActiveCollabs.length === 0 &&
    transformedActiveMeetings.length === 0
  const isLoading = isCollabsLoading || isMeetingSessionsLoading

  if (meetingSessionsError) {
    console.error('Error loading active meetings:', meetingSessionsError)
  }

  if (isLoading)
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        minHeight={150}
        width="100%"
      >
        <CircularProgress size={20} />
      </Stack>
    )

  if (hasNoMeetings && showEmptyPlaceholder) {
    return (
      <Stack
        alignItems="center"
        height="100%"
        justifyContent="center"
        minHeight={100}
        width="100%"
      >
        <Stack>
          <Typography
            color="text.secondary"
            fontWeight={500}
            textAlign="center"
            variant="body1"
          >
            No Live Meetings
          </Typography>

          <Typography color="text.secondary" textAlign="center" variant="body2">
            Your live meetings will show up here once available.
          </Typography>
        </Stack>
      </Stack>
    )
  }

  return (
    <>
      {transformedActiveCollabs.map((meeting) => (
        <MeetingDataSourceItem
          id={meeting.id}
          initialCompanionStatus={meeting.companion_status ?? null}
          key={meeting.id}
          meetingUrl={meeting.meetingUrl}
          onEndMeeting={() => handleEndMeeting(meeting.id, meeting.type)}
          onToggleStatus={() =>
            handleTogglePlayStatus(meeting.id, meeting.status)
          }
          showControls={!isGuestOrStaff}
          status={meeting.status}
          title={meeting.name ?? 'Untilted Meeting'}
          type={meeting.type}
        />
      ))}

      {transformedActiveMeetings.map((meeting) => (
        <MeetingDataSourceItem
          id={meeting.id}
          initialCompanionStatus={meeting.companionStatus ?? null}
          key={meeting.id}
          meetingUrl={meeting.url}
          onEndMeeting={() => handleEndMeeting(meeting.id, meeting.type)}
          onToggleStatus={() =>
            handleTogglePlayStatus(meeting.id, meeting.status)
          }
          showControls={!isGuestOrStaff}
          status={meeting.status}
          title={meeting.title}
          type={meeting.type}
        />
      ))}
    </>
  )
}
