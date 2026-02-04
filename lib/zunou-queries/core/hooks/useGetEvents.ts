import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PaginatedEvents } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  events: PaginatedEvents
}

const getEventsQueryDocument = graphql(/* GraphQL */ `
  query GetEvents($input: EventsInput!) {
    events(input: $input) {
      data {
        ...EventFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetEvents = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated && options.enabled,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getEventsQueryDocument,
        { input: variables },
      )
      return result
    },
    queryKey: [
      'events',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
      variables?.dateRange,
      variables?.search,
      variables?.sortOrder,
      variables?.page,
      variables?.perPage,
    ],
  })

  return response
}
