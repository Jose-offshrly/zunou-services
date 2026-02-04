import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateMeetingInput, Meeting } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateMeetingResponse {
  meeting: Meeting
}

const CREATE_MEETING_MUTATION = graphql(/* GraphQL */ `
  mutation CreateMeeting($input: CreateMeetingInput!) {
    createMeeting(input: $input) {
      ...MeetingFragment
    }
  }
`)

export const useCreateMeetingMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateMeetingResponse,
  Error,
  CreateMeetingInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMeetingInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateMeetingResponse>(
        CREATE_MEETING_MUTATION,
        {
          input,
        },
      )
    },
    onError: (error) => {
      console.error('Error creating meeting:', error)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meetings'],
      })

      queryClient.invalidateQueries({
        queryKey: ['dataSources'],
      })
    },
  })
}
