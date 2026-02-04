import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Integration } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  integration: Integration
}

const getIntegrationQueryDocument = graphql(/* GraphQL */ `
  query GetIntegration($userId: String!, $pulseId: String!, $type: String!) {
    integration(userId: $userId, pulseId: $pulseId, type: $type) {
      ...IntegrationFragment
    }
  }
`)

export const useGetIntegration = ({
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
        getIntegrationQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'integration',
      variables?.pulseId,
      variables?.userId,
      variables?.type,
    ],
  })

  return response
}
