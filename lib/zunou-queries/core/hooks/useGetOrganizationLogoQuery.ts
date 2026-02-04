import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type {
  GetOrganizationLogoQuery,
  GetOrganizationLogoQueryVariables,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const GET_ORGANIZATION_LOGO_QUERY = graphql(/* GraphQL */ `
  query GetOrganizationLogo($organizationId: String!) {
    organizationLogo(organizationId: $organizationId) {
      url
      fileName
    }
  }
`)

type GetOrganizationLogoQueryOptions = Omit<QueryOptions, 'variables'> & {
  variables: GetOrganizationLogoQueryVariables
}

export const useGetOrganizationLogoQuery = ({
  coreUrl,
  variables,
  ...options
}: GetOrganizationLogoQueryOptions): UseQueryResult<GetOrganizationLogoQuery> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery<GetOrganizationLogoQuery>({
    ...options,
    enabled: isAuthenticated && !!variables?.organizationId,
    queryFn: async () => {
      if (!variables?.organizationId) {
        throw new Error('organizationId is required')
      }
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<
        GetOrganizationLogoQuery,
        GetOrganizationLogoQueryVariables
      >(GET_ORGANIZATION_LOGO_QUERY, {
        organizationId: variables.organizationId,
      })
      return result
    },
    queryKey: ['organizationLogo', variables?.organizationId],
  })

  return response
}
