import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateStrategyInput, Strategy } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateStrategyResponse {
  strategy: Strategy
}

const createStrategyMutationDocument = graphql(/* GraphQL */ `
  mutation CreateStrategy($input: CreateStrategyInput!) {
    createStrategy(input: $input) {
      ...StrategyFragment
    }
  }
`)

export const useCreateStrategyMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateStrategyResponse,
  Error,
  CreateStrategyInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStrategyInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateStrategyResponse>(
        createStrategyMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['strategies'],
      })
    },
  })
}
