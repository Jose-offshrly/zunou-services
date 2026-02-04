import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreateMeetingSessionInput,
  MeetingSession,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateMeetingSessionResponse {
  createMeetingSession: MeetingSession
}

const CREATE_MEETING_SESSION_MUTATION = `
  mutation CreateMeetingSession($input: CreateMeetingSessionInput!) {
    createMeetingSession(input: $input) {
      id
      meetingId
      meetingUrl
      status
      pulseId
      organizationId
    }
  }
`

export const useCreateMeetingSessionMutation = ({
  coreUrl,
}: MutationOptions) => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingSessionInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateMeetingSessionResponse>(
        CREATE_MEETING_SESSION_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          variables.organizationId,
          variables.pulseId,
        ],
      })
      queryClient.invalidateQueries({
        queryKey: ['eventInstances', variables.pulseId],
      })
    },
  })
}
