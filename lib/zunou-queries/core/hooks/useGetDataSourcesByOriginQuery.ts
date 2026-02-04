import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { DataSourcePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  dataSourcesByOrigin: DataSourcePaginator
}

const getDataSourcesByOriginQueryDocument = graphql(/* GraphQL */ `
  query GetDataSourcesByOrigin(
    $organizationId: String!
    $pulseId: String!
    $origin: DataSourceOrigin!
    $page: Int
  ) {
    dataSourcesByOrigin(
      organizationId: $organizationId
      pulseId: $pulseId
      origin: $origin
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

export const useGetDataSourcesByOriginQuery = ({
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
        getDataSourcesByOriginQueryDocument,
        variables,
      )
      return result
    },
    queryKey: [
      'dataSources',
      variables?.organizationId,
      variables?.pulseId,
      variables?.origin,
      variables?.page,
    ],
  })

  return response
}
