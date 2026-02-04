import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  LiveInsightOutbox,
  MarkLiveInsightClosedInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface MarkLiveInsightClosedResponse {
  markLiveInsightClosed: LiveInsightOutbox
}

const markLiveInsightClosedMutationDocument = graphql(/* GraphQL */ `
  mutation MarkLiveInsightClosed($input: MarkLiveInsightClosedInput!) {
    markLiveInsightClosed(input: $input) {
      id
      delivery_status
    }
  }
`)

export const useUpdateInsightClosedMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  MarkLiveInsightClosedResponse,
  Error,
  MarkLiveInsightClosedInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: MarkLiveInsightClosedInput) => {
      try {
        const token = await getToken()

        const response = await gqlClient(
          coreUrl,
          token,
        ).request<MarkLiveInsightClosedResponse>(
          markLiveInsightClosedMutationDocument,
          { input },
        )
        return response
      } catch (error) {
        console.error('Error marking live insight as closed:', error)
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
