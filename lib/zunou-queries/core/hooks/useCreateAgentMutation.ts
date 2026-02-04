import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Agent, CreateAgentInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateAgentResponse {
  createAgent: Agent
}

const CREATE_AGENT_MUTATION = graphql(/* GraphQL */ `
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      ...AgentFragment
    }
  }
`)

export const useCreateAgentMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateAgentResponse,
  Error,
  CreateAgentInput
> => {
  const { getToken } = useAuthContext()
  return useMutation({
    mutationFn: async (input: CreateAgentInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateAgentResponse>(
        CREATE_AGENT_MUTATION,
        {
          input,
        },
      )
    },
  })
}
