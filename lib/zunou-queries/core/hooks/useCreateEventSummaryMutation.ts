import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateEventSummaryInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateEventSummaryResponse {
  createEventSummary: string
}

interface CreateEventSummaryInputWithMeetingId extends CreateEventSummaryInput {
  meetingSessionId?: string
}

const createEventSummaryMutationDocument = graphql(/* GraphQL */ `
  mutation createEventSummaryMutation($input: CreateEventSummaryInput!) {
    createEventSummary(input: $input)
  }
`)

export const useCreateEventSummaryMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateEventSummaryResponse,
  Error,
  CreateEventSummaryInputWithMeetingId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateEventSummaryInputWithMeetingId) => {
      const token = await getToken()
      const { meetingSessionId: _meetingSessionId, ...summaryInput } = input

      return gqlClient(coreUrl, token).request<CreateEventSummaryResponse>(
        createEventSummaryMutationDocument,
        {
          input: summaryInput,
        },
      )
    },
    onSuccess: async (_, variables) => {
      if (variables?.meetingSessionId) {
        await queryClient.invalidateQueries({
          queryKey: ['meetingSession', variables.meetingSessionId],
        })
      }

      await queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          variables.organizationId,
          variables.pulseId,
        ],
      })
    },
  })
}
