import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
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

export const useGetInfiniteEvents = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<PaginatedEvents>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchEvents = async ({ pageParam = 1 }: { pageParam?: number }) => {
    const token = await getToken()

    const result = await gqlClient(coreUrl, token).request<QueryResponse>(
      getEventsQueryDocument,
      { input: { ...variables, page: pageParam } },
    )

    return result.events
  }

  const response = useInfiniteQuery({
    ...options,
    enabled: isAuthenticated && options.enabled !== false,
    getNextPageParam: (lastPage) => {
      // supply next page only if more pages exist
      if (
        lastPage.paginatorInfo.hasMorePages &&
        lastPage.data.length > 0 &&
        lastPage.paginatorInfo.currentPage < lastPage.paginatorInfo.lastPage
      ) {
        return lastPage.paginatorInfo.currentPage + 1
      }

      return undefined
    },
    initialPageParam: 1,
    queryFn: fetchEvents,
    queryKey: [
      'events',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
      variables?.dateRange,
      variables?.search,
      variables?.sortOrder,
      variables?.perPage,
    ],
  })

  return response
}
