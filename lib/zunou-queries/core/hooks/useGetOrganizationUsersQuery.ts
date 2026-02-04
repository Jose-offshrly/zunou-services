import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationUserPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizationUsers: OrganizationUserPaginator
}

const GET_ORGANIZATION_USERS_QUERY = graphql(/* GraphQL */ `
  query GetOrganizationUsers(
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

export const useGetOrganizationUsersQuery = ({
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
        GET_ORGANIZATION_USERS_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'organizationUsers',
      variables?.organizationId,
      variables?.name,
      variables?.page,
    ],
  })

  return response
}
