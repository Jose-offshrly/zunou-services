import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { AiAgent, CreateAiAgentInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateAiAgentMutationResponse {
  aiAgent: AiAgent
}

const createAiAgentMutationDocument = graphql(/* GraphQL */ `
  mutation CreateAiAgent($input: CreateAiAgentInput!) {
    createAiAgent(input: $input) {
      ...AiAgentFragment
    }
  }
`)

export const useCreateAiAgentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateAiAgentMutationResponse,
  Error,
  CreateAiAgentInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAiAgentInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateAiAgentMutationResponse>(
        createAiAgentMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['ai-agents'],
      })
    },
  })
}
