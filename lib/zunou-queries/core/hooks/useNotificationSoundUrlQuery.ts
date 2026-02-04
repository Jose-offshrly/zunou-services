import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  notificationSoundUrl: string
}

const notificationSoundUrlQueryDocument = graphql(/* GraphQL */ `
  query NotificationSoundUrl {
    notificationSoundUrl
  }
`)

export const useNotificationSoundUrlQuery = ({
  coreUrl,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        notificationSoundUrlQueryDocument,
      )
      return result
    },
    queryKey: ['notificationSoundUrl'],
  })
}
