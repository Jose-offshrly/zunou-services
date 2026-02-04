import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationUserPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizationUsers: OrganizationUserPaginator
}

const GET_ORGANIZATION_USERS_QUERY = graphql(/* GraphQL */ `
  query GetOrganizationUsersInfinite(
    $name: String
    $organizationId: String!
    $page: Int
  ) {
    organizationUsers(
      name: $name
      organizationId: $organizationId
      page: $page
    ) {
      data {
        ...OrganizationUserFragment
        user {
          ...UserFragment
          presence
        }
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetOrganizationUsersInfiniteQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<QueryResponse>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useInfiniteQuery({
    ...options,
    enabled: isAuthenticated,
    getNextPageParam: (lastPage: QueryResponse) => {
      const { currentPage, lastPage: totalPages } =
        lastPage.organizationUsers.paginatorInfo
      return currentPage < totalPages ? currentPage + 1 : undefined
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_ORGANIZATION_USERS_QUERY,
        {
          ...variables,
          page: pageParam,
        },
      )
      return result
    },
    queryKey: [
      'organizationUsers',
      'infinite',
      variables?.organizationId,
      variables?.name,
    ],
  })
}
