import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { ThreadPaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  threads: ThreadPaginator
}

const GET_THREADS_QUERY = graphql(/* GraphQL */ `
  query GetThreads(
    $name: String
    $organizationId: String!
    $type: String
    $page: Int
  ) {
    threads(
      name: $name
      organizationId: $organizationId
      type: $type
      page: $page
    ) {
      data {
        ...ThreadFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetThreadsQuery = ({
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
        GET_THREADS_QUERY,
        variables,
      )
      return result
    },
    queryKey: [
      'threads',
      variables?.name,
      variables?.organizationId,
      variables?.page,
      variables?.type,
    ],
  })

  return response
}
