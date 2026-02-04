import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { ActivityPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  activities: ActivityPaginator
}

const GET_ACTIVITIES_QUERY = graphql(/* GraphQL */ `
  query GetActivities(
    $organizationId: String!
    $receiverId: String!
    $pulseId: String
    $page: Int
  ) {
    activities(
      organizationId: $organizationId
      receiverId: $receiverId
      pulseId: $pulseId
      page: $page
    ) {
      data {
        ...ActivityFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetActivitiesQuery = ({
  coreUrl,
  variables,
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<ActivityPaginator>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchActivities = async ({ pageParam = 1 }: { pageParam?: number }) => {
    const token = await getToken()

    const result = await gqlClient(coreUrl, token).request<QueryResponse>(
      GET_ACTIVITIES_QUERY,
      { ...variables, page: pageParam },
    )

    return result.activities
  }

  const response = useInfiniteQuery({
    enabled: isAuthenticated,
    getNextPageParam: (lastPage) => {
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
    queryFn: fetchActivities,
    queryKey: [
      'activities',
      variables?.organizationId,
      variables?.receiverId,
      variables?.pulseId,
    ],
  })

  return response
}
