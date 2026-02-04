import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { DataSourcePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  dataSources: DataSourcePaginator
}

const GET_DATA_SOURCES_QUERY = graphql(/* GraphQL */ `
  query GetDataSources(
    $pulseId: String!
    $name: String
    $organizationId: String!
    $page: Int
  ) {
    dataSources(
      pulseId: $pulseId
      name: $name
      organizationId: $organizationId
      page: $page
    ) {
      data {
        ...DataSourceFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetDataSourcesQuery = ({
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
        GET_DATA_SOURCES_QUERY,
        variables,
      )
      return result
    },
    queryKey: ['dataSources', variables?.organizationId, variables?.pulseId],
  })

  return response
}
