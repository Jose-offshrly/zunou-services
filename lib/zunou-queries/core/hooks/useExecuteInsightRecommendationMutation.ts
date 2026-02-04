import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  ExecuteInsightRecommendationInput,
  ExecutionResult,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ExecuteInsightRecommendationResponse {
  executeInsightRecommendation: ExecutionResult
}

const EXECUTE_INSIGHT_RECOMMENDATION_MUTATION = graphql(/* GraphQL */ `
  mutation ExecuteInsightRecommendation(
    $input: ExecuteInsightRecommendationInput!
  ) {
    executeInsightRecommendation(input: $input) {
      success
      message
    }
  }
`)

export const useExecuteInsightRecommendationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  ExecuteInsightRecommendationResponse,
  Error,
  ExecuteInsightRecommendationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ExecuteInsightRecommendationInput) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<ExecuteInsightRecommendationResponse>(
        EXECUTE_INSIGHT_RECOMMENDATION_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_response, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['liveInsightsRecommendation', variables?.insightId],
      })
    },
  })
}
