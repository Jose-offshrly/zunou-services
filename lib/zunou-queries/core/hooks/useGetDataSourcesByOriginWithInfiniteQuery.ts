import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { DataSourcePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  dataSourcesByOrigin: DataSourcePaginator
}

const getDataSourcesByOriginQueryDocument = graphql(/* GraphQL */ `
  query GetDataSourcesByOriginWithInfiniteQuery(
    $organizationId: String!
    $pulseId: String!
    $meetingName: String
    $origin: DataSourceOrigin!
    $page: Int
  ) {
    dataSourcesByOrigin(
      organizationId: $organizationId
      pulseId: $pulseId
      meetingName: $meetingName
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

export const useGetDataSourcesByOriginWithInfiniteQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<QueryResponse>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const response = useInfiniteQuery<QueryResponse>({
    ...options,
    enabled: isAuthenticated,
    getNextPageParam: (lastPage) => {
      const paginatorInfo = lastPage.dataSourcesByOrigin.paginatorInfo
      if (paginatorInfo.currentPage < paginatorInfo.lastPage) {
        return paginatorInfo.currentPage + 1
      }
      return undefined
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getDataSourcesByOriginQueryDocument,
        {
          ...variables,
          page: pageParam,
        },
      )
      return result
    },
    queryKey: [
      'dataSources',
      variables?.organizationId,
      variables?.pulseId,
      variables?.origin,
      variables?.meetingName,
    ],
  })

  return response
}
