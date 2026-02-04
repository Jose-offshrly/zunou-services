import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Notification } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  organizationNotifications: {
    data: Notification[]
    paginatorInfo: {
      currentPage: number
      lastPage: number
      total: number
    }
  }
}

const organizationNotificationsQueryDocument = graphql(/* GraphQL */ `
  query organizationNotifications($organizationId: String!, $page: Int) {
    organizationNotifications(organizationId: $organizationId, page: $page) {
      data {
        ...NotificationFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useOrganizationNotificationsQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        organizationNotificationsQueryDocument,
        variables,
      )
      return result
    },

    queryKey: [
      'organizationNotifications',
      variables?.organizationId,
      variables?.page,
    ],
  })
}
