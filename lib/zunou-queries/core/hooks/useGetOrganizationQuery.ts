import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Organization } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organization: Organization
}

const GET_ORGANIZATION_QUERY = graphql(/* GraphQL */ `
  query GetOrganization($organizationId: String!) {
    organization(organizationId: $organizationId) {
      ...OrganizationFragment
    }
  }
`)

export const useGetOrganizationQuery = ({
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
        GET_ORGANIZATION_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['organization', variables?.organizationId],
  })

  return response
}
