import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type {
  GiveLiveInsightFeedbackInput,
  LiveInsightOutboxFeedback,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GiveLiveInsightFeedbackResponse {
  giveLiveInsightFeedback: LiveInsightOutboxFeedback
}

const GIVE_LIVE_INSIGHT_FEEDBACK_MUTATION = graphql(/* GraphQL */ `
  mutation GiveLiveInsightFeedback($input: GiveLiveInsightFeedbackInput!) {
    giveLiveInsightFeedback(input: $input) {
      id
      outbox_id
      user_id
      rating
      tags
      comment
      created_at
    }
  }
`)

interface GiveLiveInsightFeedbackInputWithOrgID
  extends GiveLiveInsightFeedbackInput {
  organizationId: string
}

export const useGiveLiveInsightFeedbackMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  GiveLiveInsightFeedbackResponse,
  Error,
  GiveLiveInsightFeedbackInputWithOrgID
> => {
  const queryClient = useQueryClient()
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: GiveLiveInsightFeedbackInputWithOrgID) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GiveLiveInsightFeedbackResponse>(
        GIVE_LIVE_INSIGHT_FEEDBACK_MUTATION,
        {
          input: {
            comment: input.comment,
            outboxId: input.outboxId,
            rating: input.rating,
            tags: input.tags,
          },
        },
      )
    },
    onSuccess: (_res, variables) => {
      // Invalidate list
      queryClient.invalidateQueries({
        queryKey: ['liveInsights', variables.organizationId],
      })

      // Invalidate detail
      queryClient.invalidateQueries({
        queryKey: ['liveInsight', variables.outboxId],
      })
    },
  })
}
