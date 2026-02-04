import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { UserPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  users: UserPaginator
}

const GET_USERS_QUERY = graphql(/* GraphQL */ `
  query GetUsers($name: String, $organizationId: String, $page: Int) {
    users(name: $name, organizationId: $organizationId, page: $page) {
      data {
        ...UserFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetUsersQuery = ({
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
        GET_USERS_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'users',
      variables?.name,
      variables?.organizationId,
      variables?.page,
    ],
  })

  return response
}
