import {
  MeetingSessionStatus,
  MeetingSessionType,
} from '@zunou-graphql/core/graphql'
import { useCreateMeetingSessionMutation } from '@zunou-queries/core/hooks/useCreateMeetingSessionMutation'
import toast from 'react-hot-toast'

export const useHooks = (organizationId: string) => {
  const {
    mutateAsync: createMeetingSession,
    isPending: isCreateMeetingSessionPending,
  } = useCreateMeetingSessionMutation({
    coreUrl: import.meta.env.VITE_CORE_GRAPHQL_URL,
  })

  const createMeeting = async (
    url: string,
    invitePulse: boolean,
    passcode?: string | null,
    pulseId?: string,
    onSuccess?: () => void,
  ) => {
    if (pulseId) {
      const input = {
        invite_pulse: Boolean(invitePulse),
        meeting_url: url,
        organizationId,
        pulseId,
        status: MeetingSessionStatus.Active,
        type: MeetingSessionType.Meeting,
        ...(passcode ? { passcode } : {}),
      }
      await createMeetingSession(input, {
        onError: (error: unknown) => {
          console.error('Failed to create meeting session:', error)
          let message = 'Failed to create meeting session'
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
        onSuccess: () => {
          toast.success('Meeting session created successfully')
          onSuccess?.()
        },
      })
    } else {
      onSuccess?.()
    }
  }

  return { createMeeting, isCreateMeetingSessionPending }
}
