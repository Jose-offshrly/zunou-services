import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Widget } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  widgets: Widget[]
}

const GET_WIDGETS_QUERY = graphql(/* GraphQL */ `
  query GetWidgets($userId: String!, $organizationId: String!) {
    widgets(userId: $userId, organizationId: $organizationId) {
      ...WidgetFragment
    }
  }
`)

export const useGetWidgetsQuery = ({
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
        GET_WIDGETS_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['widgets', variables?.userId, variables?.organizationId],
  })

  return response
}
