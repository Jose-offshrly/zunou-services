import { useInfiniteQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  LiveInsightsFilter,
  PaginatedLiveInsights,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

export interface QueryResponse {
  myLiveInsights: PaginatedLiveInsights
}

export interface QueryVariables {
  filter?: LiveInsightsFilter
  page?: number
  perPage?: number
}

interface InfiniteQueryOptions {
  coreUrl: string
  variables?: Omit<QueryVariables, 'page'>
  enabled?: boolean
}

const getLiveInsightsQueryDocument = graphql(/* GraphQL */ `
  query GetLiveInsights(
    $filter: LiveInsightsFilter
    $page: Int
    $perPage: Int
  ) {
    myLiveInsights(filter: $filter, page: $page, perPage: $perPage) {
      data {
        id
        item_hash
        topic
        description
        type
        explanation
        created_at
        delivery_status
        organization {
          id
        }
        pulse {
          id
        }
        feedback {
          id
          outbox_id
          rating
          comment
        }
        meeting {
          id
          meetingId
        }
      }
      paginatorInfo {
        __typename
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`)

export const useGetLiveInsightsQuery = ({
  coreUrl,
  variables,
  enabled = true,
}: InfiniteQueryOptions) => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useInfiniteQuery<QueryResponse, unknown>({
    enabled: isAuthenticated && enabled,
    getNextPageParam: (lastPage: QueryResponse) => {
      const { currentPage, hasMorePages } =
        lastPage.myLiveInsights.paginatorInfo
      return hasMorePages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken()
      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getLiveInsightsQueryDocument,
        {
          ...variables,
          page: pageParam,
        },
      )
      return result
    },
    // More specific query key with serialized filter values
    queryKey: [
      'liveInsights',
      variables?.filter?.organizationId,
      variables?.filter?.statuses,
      variables?.filter?.type,
      variables?.filter?.pulseId,
      variables?.filter?.meetingId,
      variables?.perPage,
    ],
    refetchOnMount: false,
  })

  return response
}
