import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateIntegrationInput,
  Integration,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateIntegrationResponse {
  createIntegration: Integration
}

const createIntegrationMutationDocument = graphql(/* GraphQL */ `
  mutation createIntegrationMutation($input: CreateIntegrationInput!) {
    createIntegration(input: $input) {
      ...IntegrationFragment
    }
  }
`)

export const useCreateIntegrationMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateIntegrationResponse,
  Error,
  CreateIntegrationInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateIntegrationInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateIntegrationResponse>(
        createIntegrationMutationDocument,
        { input },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['integrations'],
      })

      queryClient.invalidateQueries({
        queryKey: ['integration'],
      })
    },
  })
}
