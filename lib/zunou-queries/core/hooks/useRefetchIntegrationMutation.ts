import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  Integration,
  RefetchIntegrationInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface RefetchIntegrationResponse {
  refetchIntegration: Integration
}

const refetchIntegrationMutationDocument = graphql(/* GraphQL */ `
  mutation refetchIntegrationMutation($input: RefetchIntegrationInput!) {
    refetchIntegration(input: $input) {
      ...IntegrationFragment
    }
  }
`)

export const useRefetchIntegrationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  RefetchIntegrationResponse,
  Error,
  RefetchIntegrationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RefetchIntegrationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<RefetchIntegrationResponse>(
        refetchIntegrationMutationDocument,
        { input },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['meeting'],
      })

      queryClient.invalidateQueries({
        queryKey: ['meetings'],
      })

      queryClient.invalidateQueries({
        queryKey: ['integrations'],
      })

      queryClient.invalidateQueries({
        queryKey: ['integration'],
      })
    },
  })
}
