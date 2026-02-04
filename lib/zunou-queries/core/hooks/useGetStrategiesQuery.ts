import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { GroupedStrategies } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  strategies: GroupedStrategies
}

const GET_STRATEGIES_QUERY = graphql(/* GraphQL */ `
  query GetStrategies($pulseId: String!) {
    strategies(pulseId: $pulseId) {
      alerts {
        ...StrategyFragment
      }
      kpis {
        ...StrategyFragment
      }
      automations {
        ...StrategyFragment
      }
      missions {
        ...StrategyFragment
      }
    }
  }
`)

export const useGetStrategiesQuery = ({
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
        GET_STRATEGIES_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['strategies', variables?.pulseId],
  })

  return response
}
