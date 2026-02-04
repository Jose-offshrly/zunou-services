import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Meeting } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface IgnoreMeetingResponse {
  ignoreMeeting: Meeting
}

interface IgnoreMeetingVariables {
  meetingId: string
}

const ignoreMeetingMutationDocument = graphql(/* GraphQL */ `
  mutation IgnoreMeeting($meetingId: String!) {
    ignoreMeeting(meetingId: $meetingId) {
      ...MeetingFragment
    }
  }
`)

export const useIgnoreMeetingMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  IgnoreMeetingResponse,
  Error,
  IgnoreMeetingVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ meetingId }: IgnoreMeetingVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<IgnoreMeetingResponse>(
        ignoreMeetingMutationDocument,
        {
          meetingId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['meeting', variables.meetingId],
      })
      queryClient.invalidateQueries({
        queryKey: ['meetings'],
      })
    },
  })
}
