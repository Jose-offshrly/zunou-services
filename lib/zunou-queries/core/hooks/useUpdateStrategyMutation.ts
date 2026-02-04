import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Strategy, UpdateStrategyInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateStrategyResponse {
  updateStrategy: Strategy
}

const UPDATE_STRATEGY_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateStrategy($input: UpdateStrategyInput!) {
    updateStrategy(input: $input) {
      ...StrategyFragment
    }
  }
`)

export const useUpdateStrategyMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateStrategyResponse,
  Error,
  UpdateStrategyInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateStrategyInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateStrategyResponse>(
        UPDATE_STRATEGY_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['strategies'],
      })
      queryClient.invalidateQueries({
        queryKey: ['strategy', variables.id],
      })
    },
  })
}
