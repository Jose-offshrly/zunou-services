import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { MisalignmentAlert } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  unacknowledgedMisalignmentAlerts: {
    data: MisalignmentAlert[]
  }
}

const unacknowledgedMisalignmentAlertsQueryDocument = graphql(/* GraphQL */ `
  query GetUnacknowledgedMisalignmentAlerts($organizationId: String!) {
    unacknowledgedMisalignmentAlerts(organizationId: $organizationId) {
      data {
        ...UnacknowledgedMisalignmentFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetUnacknowledgedMisalignmentAlertsQuery = ({
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
        unacknowledgedMisalignmentAlertsQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'misalignmentAlerts',
      variables?.name,
      variables?.oragnizationId,
      variables?.page,
    ],
  })

  return response
}
