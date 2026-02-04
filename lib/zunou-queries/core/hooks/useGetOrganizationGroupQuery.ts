import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { OrganizationGroup } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizationGroup: OrganizationGroup
}

interface Variables {
  organizationGroupId: string
}

const getOrganizationGroupQueryDocument = graphql(/* GraphQL */ `
  query OrganizationGroup($organizationGroupId: ID!) {
    organizationGroup(organizationGroupId: $organizationGroupId) {
      id
      name
      description
      pulseMembers {
        id
        user {
          email
          name
          gravatar
          presence
        }
      }
    }
  }
`) as TypedDocumentNode<QueryResponse, Variables>

export const useGetOrganizationGroupQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.organizationGroupId,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getOrganizationGroupQueryDocument,
        variables,
      )

      return result
    },
    queryKey: ['organizationGroup', variables?.organizationGroupId],
  })

  return response
}
