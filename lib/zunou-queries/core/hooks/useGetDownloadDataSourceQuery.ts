import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DownloadDataSource {
  url: string
}

interface QueryResponse {
  downloadDataSource: DownloadDataSource
}

const GET_DOWNLOAD_DATA_SOURCE_QUERY = graphql(/* GraphQL */ `
  query GetDownloadDataSource($dataSourceId: String!) {
    downloadDataSource(dataSourceId: $dataSourceId) {
      url
    }
  }
`)

export interface GetDownloadDataSourceQueryOptions
  extends Omit<QueryOptions, 'variables'> {
  coreUrl: string
  dataSourceId: string
}

export const useGetDownloadDataSourceQuery = ({
  coreUrl,
  dataSourceId,
  ...options
}: GetDownloadDataSourceQueryOptions): UseQueryResult<QueryResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()
  const response = useQuery({
    ...options,
    enabled: isAuthenticated,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        GET_DOWNLOAD_DATA_SOURCE_QUERY,
        { dataSourceId },
      )
      return result
    },
    queryKey: ['downloadDataSource', dataSourceId],
  })

  return response
}
