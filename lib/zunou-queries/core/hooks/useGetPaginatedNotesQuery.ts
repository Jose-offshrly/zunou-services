import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { PaginatedNotes } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  paginatedNotes: PaginatedNotes
}

// prettier-ignore
const getPaginatedNotesQueryDocument = graphql(/* GraphQL */ `
  query GetPaginatedNotes(
    $input: PaginatedNotesInput!
  ) {
    paginatedNotes(input: $input) {
      data {
        id
        title
        content
        pinned
        updatedAt
        position
        dataSourceId
        pulseId
        labels {
          id
          name
          color
          pulse {
            id
          }
        }
        pulse {
          id
        }
        files {
          id
          path
          file_name
          type
          url
          size
        }
        dataSource {
          id
          name
        }
      }
      paginatorInfo {
        count
        currentPage
        firstItem
        hasMorePages
        lastItem
        lastPage
        perPage
        total
      }
    }
  }
`)

export const useGetPaginatedNotesQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<PaginatedNotes>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useInfiniteQuery({
    ...options,
    enabled: isAuthenticated && options.enabled,
    getNextPageParam: (lastPage) => {
      return (lastPage as PaginatedNotes).paginatorInfo.hasMorePages
        ? (lastPage as PaginatedNotes).paginatorInfo.currentPage + 1
        : undefined
    },
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        getPaginatedNotesQueryDocument,
        {
          input: {
            ...variables,
            page: pageParam,
          },
        },
      )
      return result.paginatedNotes
    },
    queryKey: [
      'paginatedNotes',
      variables?.organizationId,
      variables?.pulseId,
      variables?.userId,
      variables?.viewAllLabels,
      variables?.perPage,
    ],
  })
}
