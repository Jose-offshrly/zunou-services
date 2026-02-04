import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  StrategyDescription,
  StrategyDescriptionInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateStrategyDescriptionResponse {
  createStrategyDescription: StrategyDescription
}

const createStrategyDescriptionMutationDocument = graphql(/* GraphQL */ `
  mutation CreateStrategyDescription($input: StrategyDescriptionInput!) {
    createStrategyDescription(input: $input) {
      ...StrategyDescriptionFragment
    }
  }
`)

export const useCreateStrategyDescriptionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateStrategyDescriptionResponse,
  Error,
  StrategyDescriptionInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: StrategyDescriptionInput) => {
      const token = await getToken()

      return await gqlClient(
        coreUrl,
        token,
      ).request<CreateStrategyDescriptionResponse>(
        createStrategyDescriptionMutationDocument,
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
