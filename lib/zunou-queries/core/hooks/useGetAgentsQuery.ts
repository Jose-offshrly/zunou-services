import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { AgentPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  agents: AgentPaginator
}

const GET_AGENTS_QUERY = graphql(/* GraphQL */ `
  query GetAgents(
    $name: String
    $organizationId: String!
    $pulseId: String!
    $page: Int
  ) {
    agents(
      name: $name
      organizationId: $organizationId
      pulseId: $pulseId
      page: $page
    ) {
      data {
        ...AgentFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetAgentsQuery = ({
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
        GET_AGENTS_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'agents',
      variables?.name,
      variables?.organizationId,
      variables?.page,
    ],
  })

  return response
}
