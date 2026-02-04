import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import {
  MeetingSession,
  UpdateMeetingSessionInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateMeetingSessionResponse {
  updateMeetingSession: MeetingSession
}

const UPDATE_MEETING_SESSION_MUTATION = `
  mutation UpdateMeetingSession($input: UpdateMeetingSessionInput!) {
    updateMeetingSession(input: $input) {
      id
      status
    }
  }
`

interface UpdateMeetingSessionInputWithOrgAndPulseId
  extends UpdateMeetingSessionInput {
  organizationId?: string
  pulseId?: string
}

export const useUpdateMeetingSessionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateMeetingSessionResponse,
  Error,
  UpdateMeetingSessionInputWithOrgAndPulseId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateMeetingSessionInputWithOrgAndPulseId) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateMeetingSessionResponse>(
        UPDATE_MEETING_SESSION_MUTATION,
        {
          input: {
            meetingSessionId: input.meetingSessionId,
            status: input.status,
          },
        },
      )
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
