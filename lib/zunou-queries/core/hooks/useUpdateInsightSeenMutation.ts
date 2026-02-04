import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  LiveInsightOutbox,
  MarkLiveInsightSeenInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface MarkLiveInsightSeenResponse {
  markLiveInsightSeen: LiveInsightOutbox
}

const markLiveInsightSeenMutationDocument = graphql(/* GraphQL */ `
  mutation MarkLiveInsightSeen($input: MarkLiveInsightSeenInput!) {
    markLiveInsightSeen(input: $input) {
      id
      delivery_status
    }
  }
`)

export const useUpdateInsightSeenMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  MarkLiveInsightSeenResponse,
  Error,
  MarkLiveInsightSeenInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MarkLiveInsightSeenInput) => {
      try {
        const token = await getToken()

        const response = await gqlClient(
          coreUrl,
          token,
        ).request<MarkLiveInsightSeenResponse>(
          markLiveInsightSeenMutationDocument,
          { input },
        )
        return response
      } catch (error) {
        console.error('Error marking live insight as seen:', error)
        throw error
      }
    },
    onError: (error) => {
      console.error('Error in mutation:', error)
    },
    onSuccess: (_res, variables) => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['liveInsights'],
      })

      // Invalidate detail
      queryClient.invalidateQueries({
        queryKey: ['liveInsight', variables?.id],
      })
    },
  })
}
