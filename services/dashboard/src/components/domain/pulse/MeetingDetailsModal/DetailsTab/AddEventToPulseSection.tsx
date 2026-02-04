import { AutoAwesomeOutlined, ErrorOutlineRounded } from '@mui/icons-material'
import { alpha, Button, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import {
  Event,
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { useCreateMeetingSessionMutation } from '@zunou-queries/core/hooks/useCreateMeetingSessionMutation'
import { LoadingButton } from '@zunou-react/components/form'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'

import { getMeetingStatus as getMeetingStatusUtil } from '~/utils/meetingUtils'

import { Detail, Row } from './Layout'

interface Props {
  event?: Event
  onMeetingSessionCreated?: (meetingSessionId: string) => void
}

export function AddEventToPulseSection({
  event,
  onMeetingSessionCreated,
}: Props) {
  const { organizationId, pulseId } = useParams()
  const { user } = useAuthContext()

  const [showRecurringPrompt, setShowRecurringPrompt] = useState(false)

  const queryClient = useQueryClient()

  const {
    mutateAsync: createMeetingSession,
    isPending: isCreateMeetingSessionPending,
  } = useCreateMeetingSessionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const timezone = user?.timezone ?? 'UTC'

  // Mark start at and end at as dayjs objects in user's timezone (NOT CONVERT)
  const startDateObj = dayjs.tz(event?.start_at, timezone)
  const endDateObj = dayjs.tz(event?.end_at, timezone)

  const recurring_meeting_id = event?.google_event_id?.split('_')[0]
  const isRecurringEvent =
    recurring_meeting_id && event?.google_event_id?.includes('_')

  const getMeetingStatus = useMemo(
    () =>
      getMeetingStatusUtil({
        end: endDateObj,
        start: startDateObj,
        timezone,
      }),
    [startDateObj, endDateObj, user?.timezone],
  )

  const handleAddEventClick = () => {
    if (isRecurringEvent) {
      setShowRecurringPrompt(true)
    } else {
      handleAddEvent(false)
    }
  }

  const handleAddEvent = (isRecurring: boolean) => {
    if (!organizationId) {
      toast.error('Organization ID is missing.')
      return
    }

    if (!pulseId) {
      toast.error('Pulse ID is missing.')
      return
    }

    createMeetingSession(
      {
        attendees:
          event?.attendees
            ?.map((attendee) => attendee?.user?.id)
            .filter((id): id is string => typeof id === 'string') || [],
        end_at: event?.end_at,
        event_id: event?.id,
        gcal_meeting_id: event?.google_event_id,
        invite_pulse: true,
        meeting_url: event?.link,
        name: event?.name || 'Untitled Meeting',
        organizationId,
        pulseId,
        start_at: event?.start_at,
        status: getMeetingStatus.status,
        type: MeetingSessionType.Meeting,
        ...(isRecurring
          ? { recurring_invite: true, recurring_meeting_id }
          : {}),
      },
      {
        onError: (error: unknown) => {
          let message = 'Failed to add meeting.'
          if (error && typeof error === 'object') {
            const err = error as {
              response?: { errors?: { message?: string }[] }
              message?: string
            }
            if (
              err.response &&
              Array.isArray(err.response.errors) &&
              err.response.errors[0]?.message
            ) {
              message = err.response.errors[0].message
            } else if (err.message) {
              message = err.message
            }
          }
          toast.error(message)
        },
        onSuccess: (data) => {
          toast.success('Meeting has been added.')
          setShowRecurringPrompt(false)
          if (data?.createMeetingSession?.id) {
            onMeetingSessionCreated?.(data.createMeetingSession.id)
          }

          queryClient.invalidateQueries({
            queryKey: ['events', organizationId, pulseId, user?.id],
          })
        },
      },
    )
  }

  const handleAddSingleEvent = () => {
    handleAddEvent(false)
  }

  const handleAddAllRecurring = () => {
    handleAddEvent(true)
  }

  const handleRecurringCancel = () => {
    setShowRecurringPrompt(false)
  }

  return (
    <Row
      gap={showRecurringPrompt ? 2 : 6}
      sx={{ flexDirection: showRecurringPrompt ? 'column' : 'row' }}
    >
      <Detail>
        <AutoAwesomeOutlined sx={{ fontSize: 15 }} />
        <Stack>
          <Typography fontWeight={500} variant="body2">
            Add Event to Pulse
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Add this event to your personal pulse
          </Typography>
        </Stack>
      </Detail>

      {showRecurringPrompt ? (
        <Stack
          bgcolor={(theme) => alpha(theme.palette.primary.light, 0.1)}
          borderRadius={1}
          gap={1}
          p={1.5}
          sx={{
            opacity: 0.8,
          }}
          width="100%"
        >
          <Stack
            alignItems="center"
            color={(theme) => theme.palette.primary.main}
            direction="row"
            gap={1}
          >
            <ErrorOutlineRounded fontSize="small" />
            <Typography>Apply to one or all?</Typography>
          </Stack>
          <Stack borderBottom={1} borderColor="divider" pb={1}>
            <Typography fontSize="small">
              This is a recurring meeting. Choose your preference:
            </Typography>
          </Stack>

          <Stack
            alignItems="center"
            direction="row"
            gap={1}
            justifyContent="space-between"
            pt={1}
          >
            <Stack alignItems="center" direction="row" gap={1}>
              <LoadingButton
                loading={isCreateMeetingSessionPending}
                onClick={handleAddSingleEvent}
                variant="outlined"
              >
                Add This Event
              </LoadingButton>
              <LoadingButton
                loading={isCreateMeetingSessionPending}
                onClick={handleAddAllRecurring}
                variant="contained"
              >
                Add All Recurring
              </LoadingButton>
            </Stack>

            <Button onClick={handleRecurringCancel} variant="text">
              Cancel
            </Button>
          </Stack>
        </Stack>
      ) : (
        <LoadingButton
          disabled={getMeetingStatus.status === MeetingSessionStatus.Ended}
          loading={isCreateMeetingSessionPending}
          onClick={handleAddEventClick}
          variant="contained"
        >
          {getMeetingStatus.status === MeetingSessionStatus.Ended
            ? 'Ended'
            : 'Add'}
        </LoadingButton>
      )}
    </Row>
  )
}
