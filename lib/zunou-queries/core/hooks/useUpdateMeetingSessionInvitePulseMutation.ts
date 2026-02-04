import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { MeetingSession } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateMeetingSessionInvitePulseResponse {
  updateMeetingSessionInvitePulse: MeetingSession
}

interface UpdateMeetingSessionInvitePulseInput {
  meetingSessionId: string
  invite_pulse: boolean
}

const UPDATE_MEETING_SESSION_INVITE_PULSE_MUTATION = `
  mutation UpdateMeetingSessionInvitePulse($input: UpdateMeetingSessionInvitePulseInput!) {
    updateMeetingSessionInvitePulse(input: $input) {
      id
      invite_pulse
    }
  }
`

export interface UpdateMeetingSessionInvitePulseInputWithPulseAndOrgId
  extends UpdateMeetingSessionInvitePulseInput {
  organizationId?: string
  pulseId?: string
}

export const useUpdateMeetingSessionInvitePulseMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateMeetingSessionInvitePulseResponse,
  Error,
  UpdateMeetingSessionInvitePulseInputWithPulseAndOrgId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: UpdateMeetingSessionInvitePulseInputWithPulseAndOrgId,
    ) => {
      try {
        const token = await getToken()

        const response = await gqlClient(
          coreUrl,
          token,
        ).request<UpdateMeetingSessionInvitePulseResponse>(
          UPDATE_MEETING_SESSION_INVITE_PULSE_MUTATION,
          {
            input: {
              invite_pulse: input.invite_pulse,
              meetingSessionId: input.meetingSessionId,
            },
          },
        )
        return response
      } catch (error) {
        console.error('Error updating meeting session invite_pulse:', error)
        throw error
      }
    },
    onError: (error) => {
      console.error('Error in mutation:', error)
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meetingSession', variables.meetingSessionId],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          variables.organizationId,
          variables.pulseId,
        ],
      })
    },
  })
}
