import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationGroupsQuery } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

const GET_ORGANIZATION_GROUPS_QUERY = graphql(/* GraphQL */ `
  query OrganizationGroups($pulseId: ID!) {
    organizationGroups(pulseId: $pulseId) {
      organizationGroups {
        ...OrganizationGroupFragment
      }
      unassignedPulseMembers {
        ...PulseMemberFragment
      }
    }
  }
`)

export const useGetOrganizationGroupsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<OrganizationGroupsQuery> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(
        coreUrl,
        token,
      ).request<OrganizationGroupsQuery>(
        GET_ORGANIZATION_GROUPS_QUERY as TypedDocumentNode<
          OrganizationGroupsQuery,
          { pulseId: string }
        >,
        variables,
      )
      return result
    },
    queryKey: ['organizationGroups', variables?.pulseId],
  })

  return response
}
