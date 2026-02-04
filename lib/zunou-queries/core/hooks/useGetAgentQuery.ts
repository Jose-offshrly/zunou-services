import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Agent } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  agent: Agent
}

const GET_AGENT_QUERY = graphql(/* GraphQL */ `
  query GetAgent(
    $agentId: String!
    $organizationId: String!
    $pulseId: String!
  ) {
    agent(
      agentId: $agentId
      organizationId: $organizationId
      pulseId: $pulseId
    ) {
      ...AgentFragment
    }
  }
`)

export const useGetAgentQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_AGENT_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['agent'],
  })

  return response
}
