import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type { TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  searchTeamThreadMessages: TeamMessagePaginator
}

const searchTeamThreadMessagesQueryDocument = graphql(/* GraphQL */ `
  query SearchTeamThreadMessages(
    $pulseId: ID!
    $organizationId: ID!
    $topicId: ID
    $page: Int
    $query: String!
    $order: String
  ) {
    searchTeamThreadMessages(
      pulseId: $pulseId
      organizationId: $organizationId
      topicId: $topicId
      page: $page
      query: $query
      order: $order
    ) {
      teamThreadId
      data {
        id
        teamThreadId
        topicId
        userId
        replyTeamThreadId
        repliedToMessageId
        repliedToMessage {
          id
          content
          isDeleted
          isEdited
          user {
            id
            name
            gravatar
          }
        }
        isParentReply
        content
        createdAt
        updatedAt
        isEdited
        isDeleted
        deletedAt
        isRead
        isPinned
        user {
          id
          name
          gravatar
        }
        topic {
          id
          name
        }
        metadata {
          excerpt
          status
        }
        groupedReactions {
          reaction
          count
          users {
            id
            name
            email
            gravatar
            createdAt
            picture
          }
        }
        files {
          id
          path
          file_name
          type
          size
          entity_type
          entity_id
          pulse_id
          organization_id
          created_at
          updated_at
          dataSourceId
          url
        }
      }
      paginatorInfo {
        count
        currentPage
        hasMorePages
        lastPage
        perPage
        total
      }
      unreadCount
    }
  }
`)

export const useSearchTeamThreadMessages = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseInfiniteQueryResult<
  InfiniteData<TeamMessagePaginator>
> => {
  const { getToken } = useAuthContext()

  const fetchSearchResults = async ({
    pageParam = 1,
  }: {
    pageParam?: number
  }) => {
    const token = await getToken()

    const result = await gqlClient(coreUrl, token).request<QueryResponse>(
      searchTeamThreadMessagesQueryDocument,
      {
        ...variables,
        page: pageParam,
      },
    )

    return result.searchTeamThreadMessages
  }

  const response = useInfiniteQuery({
    ...options,
    getNextPageParam: (lastPage) => {
      const paginatorInfo = lastPage.paginatorInfo
      return paginatorInfo.hasMorePages
        ? paginatorInfo.currentPage + 1
        : undefined
    },
    initialPageParam: 1,
    queryFn: fetchSearchResults,
    queryKey: [
      'searchTeamThread',
      variables?.pulseId,
      variables?.organizationId,
      variables?.topicId,
      variables?.query,
      variables?.order,
    ],
  })

  return response
}
