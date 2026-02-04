import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import type { NotificationPreference } from './useCreateNotificationPreferenceMutation'

interface QueryResponse {
  notificationPreferences: NotificationPreference[]
}

interface NotificationPreferencesVariables {
  userId?: string
}

const GET_NOTIFICATION_PREFERENCES_QUERY = graphql(/* GraphQL */ `
  query GetNotificationPreferences($userId: ID) {
    notificationPreferences(userId: $userId) {
      ...NotificationPreferenceFragment
    }
  }
`)

export const useGetNotificationPreferencesQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions & {
  variables?: NotificationPreferencesVariables
}): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<QueryResponse>(
        GET_NOTIFICATION_PREFERENCES_QUERY,
        variables,
      )
    },
    queryKey: ['notification-preferences', variables?.userId],
  })
}
