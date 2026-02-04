import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { DataSource } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  dataSource: DataSource
}

const GET_DATA_SOURCE_QUERY = graphql(/* GraphQL */ `
  query GetDataSource(
    $dataSourceId: String!
    $organizationId: String!
    $pulseId: String!
  ) {
    dataSource(
      dataSourceId: $dataSourceId
      organizationId: $organizationId
      pulseId: $pulseId
    ) {
      ...DataSourceFragment
    }
  }
`)

export const useGetDataSourceQuery = ({
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
        GET_DATA_SOURCE_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'dataSource',
      variables?.organizationId,
      variables?.pulseId,
      variables?.dataSourceId,
    ],
  })

  return response
}
