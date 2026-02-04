import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import type {
  TeamMessage,
  TeamMessagePaginator,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

// Re-export the TeamMessage type from GraphQL
export type { TeamMessage }

interface QueryResponse {
  teamThreadMessages: TeamMessagePaginator
}

export const GET_TEAM_THREAD_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query GetTeamThreadMessages(
    $pulseId: ID!
    $organizationId: ID!
    $topicId: ID
    $page: Int
    $unreadOnly: Boolean
  ) {
    teamThreadMessages(
      pulseId: $pulseId
      organizationId: $organizationId
      topicId: $topicId
      page: $page
      unreadOnly: $unreadOnly
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
          type
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
`) as TypedDocumentNode<
  QueryResponse,
  {
    pulseId: string
    organizationId: string
    topicId?: string
    page?: number
    unreadOnly?: boolean
  }
>

interface UseGetTeamThreadMessagesOptions extends QueryOptions {
  initialPage?: number | null
}

export const useGetTeamThreadMessages = ({
  coreUrl,
  variables,
  initialPage,
}: UseGetTeamThreadMessagesOptions): UseInfiniteQueryResult<
  InfiniteData<QueryResponse['teamThreadMessages']>
> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchTeamThreadMessages = async ({
    pageParam,
  }: {
    pageParam: number
  }): Promise<QueryResponse['teamThreadMessages']> => {
    const token = await getToken()

    const result = await gqlClient(coreUrl, token).request<QueryResponse>(
      GET_TEAM_THREAD_MESSAGES_QUERY,
      { ...variables, page: pageParam },
    )

    return result.teamThreadMessages
  }

  const response = useInfiniteQuery({
    enabled: isAuthenticated,
    gcTime: 5 * 60 * 1000, // cache message content for 5 minutes
    getNextPageParam: (lastPage) => {
      // For scrolling up (older messages) - go to previous page number
      if (
        lastPage.paginatorInfo.hasMorePages &&
        lastPage.data.length > 0 &&
        lastPage.paginatorInfo.currentPage < lastPage.paginatorInfo.lastPage
      ) {
        return lastPage.paginatorInfo.currentPage + 1
      }

      return undefined
    },
    getPreviousPageParam: (firstPage) => {
      // For scrolling down (newer messages) - go to next page number
      if (
        firstPage.paginatorInfo.currentPage > 1 &&
        firstPage.data.length > 0
      ) {
        return firstPage.paginatorInfo.currentPage - 1
      }
      return undefined
    },
    initialPageParam: initialPage ?? 1,
    queryFn: fetchTeamThreadMessages,
    queryKey: [
      'teamThreadMessages',
      variables?.pulseId,
      variables?.topicId,
      ...(initialPage ? [initialPage] : []),
    ],
    staleTime: 30 * 1000, // keep data fresh for 30 seconds
  })

  return response
}
