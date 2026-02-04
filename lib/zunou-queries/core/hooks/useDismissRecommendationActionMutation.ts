import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DismissRecommendationActionInput,
  ExecutionResult,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DismissRecommendationActionResponse {
  dismissRecommendationAction: ExecutionResult
}

const DISMISS_RECOMMENDATION_ACTION_MUTATION = graphql(/* GraphQL */ `
  mutation DismissRecommendationAction(
    $input: DismissRecommendationActionInput!
  ) {
    dismissRecommendationAction(input: $input) {
      success
      message
    }
  }
`)

interface DismissRecommendationActionInputWithRecId
  extends DismissRecommendationActionInput {
  insightId: string
}

export const useDismissRecommendationActionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DismissRecommendationActionResponse,
  Error,
  DismissRecommendationActionInputWithRecId
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recommendationActionsId,
    }: DismissRecommendationActionInputWithRecId) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<DismissRecommendationActionResponse>(
        DISMISS_RECOMMENDATION_ACTION_MUTATION,
        {
          input: {
            recommendationActionsId,
          },
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
