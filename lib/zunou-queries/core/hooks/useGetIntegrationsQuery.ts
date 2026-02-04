import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Integration } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  integrations: Integration[]
}

const GET_USER_INTEGRATIONS_QUERY = graphql(/* GraphQL */ `
  query GetIntegrations($userId: String!, $pulseId: String!) {
    integrations(userId: $userId, pulseId: $pulseId) {
      ...IntegrationFragment
    }
  }
`)

export const useGetIntegrationsQuery = ({
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
        GET_USER_INTEGRATIONS_QUERY,
        variables,
      )

      return result
    },
    queryKey: ['integrations', variables?.userId, variables?.pulseId],
  })

  return response
}
