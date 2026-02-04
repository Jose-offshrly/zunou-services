import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Event, UpdateEventInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateEventResponse {
  updateEvent: Event
}

const UPDATE_EVENT_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateEvent($input: UpdateEventInput!) {
    updateEvent(input: $input) {
      id
      organization_id
      pulse_id
    }
  }
`)

interface UpdateEventInputWithMeetingId extends UpdateEventInput {
  meetingSessionId?: string
}

export const useUpdateEventMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateEventResponse,
  Error,
  UpdateEventInputWithMeetingId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateEventInputWithMeetingId) => {
      const token = await getToken()
      const { meetingSessionId: _meetingSessionId, ...eventInput } = input

      return gqlClient(coreUrl, token).request<UpdateEventResponse>(
        UPDATE_EVENT_MUTATION,
        {
          input: eventInput,
        },
      )
    },
    onSuccess: async (response, variables) => {
      if (variables?.meetingSessionId) {
        await queryClient.invalidateQueries({
          queryKey: ['meetingSession', variables.meetingSessionId],
        })
      }

      await queryClient.invalidateQueries({
        queryKey: ['events', response.updateEvent.organization_id],
      })

      await queryClient.invalidateQueries({
        queryKey: ['event', variables?.id],
      })

      await queryClient.invalidateQueries({
        queryKey: [
          'meetingSessions',
          response.updateEvent.organization_id,
          response.updateEvent.pulse_id,
        ],
      })
    },
  })
}
