import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteStrategyResponse {
  deleteStrategy: boolean
}

const DELETE_STRATEGY_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteStrategy($strategyId: String!) {
    deleteStrategy(strategyId: $strategyId)
  }
`)

export const useDeleteStrategyMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteStrategyResponse,
  Error,
  { strategyId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ strategyId }: { strategyId: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteStrategyResponse>(
        DELETE_STRATEGY_MUTATION,
        {
          strategyId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['strategies'],
      })
      queryClient.invalidateQueries({
        queryKey: ['strategy', variables.strategyId],
      })
    },
  })
}
