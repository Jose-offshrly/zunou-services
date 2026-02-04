import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Notification } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  pulseNotifications: Notification[]
}

const pulseNotificationsQueryDocument = graphql(/* GraphQL */ `
  query pulseNotifications($pulseId: String!) {
    pulseNotifications(pulseId: $pulseId) {
      ...NotificationFragment
    }
  }
`)

export const usePulseNotificationsQuery = ({
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
        pulseNotificationsQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['pulseNotifications', variables?.pulseId],
  })
}
