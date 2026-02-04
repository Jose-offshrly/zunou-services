import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { MessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  messages: MessagePaginator
}

const GET_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query GetMessages($organizationId: String!, $threadId: String!, $page: Int) {
    messages(
      organizationId: $organizationId
      threadId: $threadId
      page: $page
    ) {
      data {
        ...MessageFragment
      }
      paginatorInfo {
        ...PaginatorInfoFragment
      }
    }
  }
`)

export const useGetMessagesQuery = ({
  coreUrl,
  variables,
}: QueryOptions): UseInfiniteQueryResult<InfiniteData<MessagePaginator>> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchMessages = async ({ pageParam = 1 }: { pageParam: number }) => {
    const token = await getToken()

    const data = await gqlClient(coreUrl, token).request<QueryResponse>(
      GET_MESSAGES_QUERY,
      { ...variables, page: pageParam },
    )

    return data.messages
  }

  const isThreadIdValid =
    typeof variables?.threadId === 'string' && variables.threadId.trim() !== ''

  const isEnabled = isAuthenticated && isThreadIdValid

  const response = useInfiniteQuery({
    enabled: isEnabled,
    getNextPageParam: (lastPage) => {
      return lastPage.paginatorInfo.hasMorePages
        ? lastPage.paginatorInfo.currentPage + 1
        : undefined
    },
    initialPageParam: 1,
    queryFn: fetchMessages,
    queryKey: ['messages', variables?.organizationId, variables?.threadId],
    select: (data) => ({
      ...data,
      pages: [...data.pages].reverse().map((page) => ({
        ...page,
        data: [...page.data].reverse(),
      })),
    }),
  })

  return response
}
