import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { AiAgent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteAiAgentResponse {
  deleteAiAgent: AiAgent
}

interface DeleteAiAgentVariables {
  aiAgentId: string
}

const deleteAiAgentMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteAiAgent($aiAgentId: String!) {
    deleteAiAgent(aiAgentId: $aiAgentId) {
      ...AiAgentFragment
    }
  }
`)

export const useDeleteAiAgentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteAiAgentResponse,
  Error,
  DeleteAiAgentVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ aiAgentId }: DeleteAiAgentVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteAiAgentResponse>(
        deleteAiAgentMutationDocument,
        {
          aiAgentId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['ai-agents'],
      })
      queryClient.invalidateQueries({
        queryKey: ['ai-agent', variables.aiAgentId],
      })
    },
  })
}
