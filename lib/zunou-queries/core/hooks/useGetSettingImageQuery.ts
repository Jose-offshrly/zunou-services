import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  settingImage: { url: string; fileName: string }
}
const getSettingImageQueryDocument = graphql(/* GraphQL */ `
  query SettingImage($settingId: ID!) {
    settingImage(settingId: $settingId) {
      url
      fileName
    }
  }
`)

export const useGetSettingImageQuery = ({
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
        getSettingImageQueryDocument,
        variables,
      )
      return result
    },
    queryKey: ['setting', variables?.settingId],
  })

  return response
}
