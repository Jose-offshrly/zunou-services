import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DataSourceUrl {
  mime: string
  url: string
}

interface QueryResponse {
  signedDataSourceUrl: DataSourceUrl
}

const GET_DATA_SOURCE_URL_QUERY = graphql(/* GraphQL */ `
  query GetDataSourceUrl($dataSourceId: ID!) {
    signedDataSourceUrl(dataSourceId: $dataSourceId) {
      mime
      url
    }
  }
`)

export const useGetDataSourceUrlQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery({
    ...options,
    enabled: isAuthenticated && !!variables?.dataSourceId,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_DATA_SOURCE_URL_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['dataSourceUrl', variables?.dataSourceId],
  })

  return response
}
