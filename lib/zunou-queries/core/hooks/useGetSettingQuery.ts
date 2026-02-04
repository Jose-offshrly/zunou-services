import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { Setting } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  setting: Setting
}

const GET_SETTING_QUERY = graphql(/* GraphQL */ `
  query GetSetting($userId: ID!, $organizationId: ID!) {
    setting(userId: $userId, organizationId: $organizationId) {
      ...SettingFragment
    }
  }
`)

export const useGetSettingQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery({
    ...options,
    enabled: options.enabled && isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_SETTING_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['setting', variables?.userId, variables?.organizationId],
  })

  return response
}
