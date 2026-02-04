import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  ExecutionResult,
  UpdateRecommendationActionInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateRecommendationActionResponse {
  updateRecommendationAction: ExecutionResult
}

const UPDATE_RECOMMENDATION_ACTION_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateRecommendationAction(
    $input: UpdateRecommendationActionInput!
  ) {
    updateRecommendationAction(input: $input) {
      success
      message
    }
  }
`)

interface UpdateRecommendationActionInputWithInsightId
  extends UpdateRecommendationActionInput {
  insightId: string
}

export const useUpdateRecommendationActionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateRecommendationActionResponse,
  Error,
  UpdateRecommendationActionInputWithInsightId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      changes,
      recommendationActionsId,
      type,
      insightId: _insightId,
    }: UpdateRecommendationActionInputWithInsightId) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<UpdateRecommendationActionResponse>(
        UPDATE_RECOMMENDATION_ACTION_MUTATION,
        {
          input: { changes, recommendationActionsId, type },
        },
      )
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['liveInsightsRecommendation', variables?.insightId],
      })
    },
  })
}
