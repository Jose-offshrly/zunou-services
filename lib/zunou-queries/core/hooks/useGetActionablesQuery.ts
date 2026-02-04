import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Actionable } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  actionables: Actionable[]
}

const GET_ACTIONABLES_QUERY = graphql(/* GraphQL */ `
  query GetActionables(
    $organizationId: String!
    $pulseId: String!
    $eventId: String
  ) {
    actionables(
      organizationId: $organizationId
      pulseId: $pulseId
      eventId: $eventId
    ) {
      ...ActionableFragment
    }
  }
`)

export const useGetActionablesQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled:
      isAuthenticated && !!variables?.organizationId && !!variables?.pulseId,
    queryFn: async () => {
      const token = await getToken()
      return gqlClient(coreUrl, token).request<QueryResponse>(
        GET_ACTIONABLES_QUERY,
        variables,
      )
    },
    queryKey: [
      'actionables',
      variables?.organizationId,
      variables?.pulseId,
      variables?.eventId,
    ],
  })
}
