import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationUser } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizationUser: OrganizationUser
}

const getOrganizationUserQueryDocument = graphql(/* GraphQL */ `
  query GetOrganizationUser($organizationId: String!, $userId: String!) {
    organizationUser(organizationId: $organizationId, userId: $userId) {
      ...OrganizationUserFragment
    }
  }
`)

export const useGetOrganizationUserQuery = ({
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
        getOrganizationUserQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'organizationUser',
      variables?.organizationId,
      variables?.userId,
    ],
  })

  return response
}
