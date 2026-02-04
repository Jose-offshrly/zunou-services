import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agent, UpdateAgentInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateAgentResponse {
  updateAgent: Agent
}

const UPDATE_AGENT_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateAgent($input: UpdateAgentInput!) {
    updateAgent(input: $input) {
      ...AgentFragment
    }
  }
`)

export const useUpdateAgentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateAgentResponse,
  Error,
  UpdateAgentInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: UpdateAgentInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateAgentResponse>(
        UPDATE_AGENT_MUTATION,
        {
          input,
        },
      )
    },
  })
}
