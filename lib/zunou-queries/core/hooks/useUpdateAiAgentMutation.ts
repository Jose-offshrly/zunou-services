import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { AiAgent, UpdateAiAgentInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateAgentResponse {
  updateAiAgent: AiAgent
}

const updateAiAgentMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateAiAgent($input: UpdateAiAgentInput!) {
    updateAiAgent(input: $input) {
      ...AiAgentFragment
    }
  }
`)

export const useUpdateAiAgentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateAgentResponse,
  Error,
  UpdateAiAgentInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: UpdateAiAgentInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateAgentResponse>(
        updateAiAgentMutationDocument,
        {
          input,
        },
      )
    },
  })
}
