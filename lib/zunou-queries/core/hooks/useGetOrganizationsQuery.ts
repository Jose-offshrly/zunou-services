import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizations: OrganizationPaginator
}

const GET_ORGANIZATIONS_QUERY = graphql(/* GraphQL */ `
  query GetOrganizations($name: String, $page: Int, $slackTeamId: String) {
    organizations(name: $name, page: $page, slackTeamId: $slackTeamId) {
      data {
        ...OrganizationFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetOrganizationsQuery = ({
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
        GET_ORGANIZATIONS_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'organizations',
      variables?.name,
      variables?.page,
      variables?.$slackTeamId,
    ],
  })

  return response
}
