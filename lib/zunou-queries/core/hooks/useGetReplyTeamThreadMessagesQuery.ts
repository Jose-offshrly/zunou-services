import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  InfiniteData,
  useInfiniteQuery,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  replyTeamThreadMessages: TeamMessagePaginator
}

export const GET_REPLY_TEAM_THREAD_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query GetReplyTeamThreadMessages(
    $organizationId: ID!
    $page: Int
    $pulseId: ID!
    $replyTeamThreadId: ID!
  ) {
    replyTeamThreadMessages(
      input: {
        organizationId: $organizationId
        page: $page
        pulseId: $pulseId
        replyTeamThreadId: $replyTeamThreadId
      }
    ) {
      data {
        id
        userId
        content
        createdAt
        updatedAt
        isEdited
        isDeleted
        repliedToMessageId
        deletedAt
        user {
          id
          name
          email
          gravatar
        }
        metadata {
          excerpt
          type
        }
        isParentReply
        teamThreadId
        groupedReactions {
          reaction
          count
          users {
            id
            name
            email
            gravatar
            google_calendar_linked
            createdAt
            onboarded
            picture
            permissions
          }
        }
        isPinned
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
    }
  }
`) as TypedDocumentNode<
  QueryResponse,
  { replyTeamThreadId: string; page?: number }
>

interface UseGetReplyTeamThreadMessagesOptions extends QueryOptions {
  initialPage?: number | null
}

export const useGetReplyTeamThreadMessagesQuery = ({
  coreUrl,
  variables,
  initialPage,
}: UseGetReplyTeamThreadMessagesOptions): UseInfiniteQueryResult<
  InfiniteData<TeamMessagePaginator>
> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchReplyTeamThreadMessages = async ({
    pageParam,
  }: {
    pageParam: number
  }) => {
    const token = await getToken()

    const data = await gqlClient(coreUrl, token).request<QueryResponse>(
      GET_REPLY_TEAM_THREAD_MESSAGES_QUERY,
      {
        organizationId: variables?.organizationId,
        page: pageParam,
        pulseId: variables?.pulseId,
        replyTeamThreadId: variables?.replyTeamThreadId,
      },
    )
    return data.replyTeamThreadMessages
  }

  const isReplyTeamThreadIdValid =
    typeof variables?.replyTeamThreadId === 'string' &&
    variables.replyTeamThreadId.trim() !== ''
  const isEnabled = isAuthenticated && isReplyTeamThreadIdValid

  const response = useInfiniteQuery({
    enabled: isEnabled,
    gcTime: initialPage !== 1 ? 0 : 5 * 60 * 1000,
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
    queryFn: fetchReplyTeamThreadMessages,
    queryKey: [
      'replyTeamThreadMessages',
      variables?.replyTeamThreadId,
      ...(initialPage ? [initialPage] : []),
    ],
    staleTime: initialPage !== 1 ? 0 : 30 * 1000,
  })

  return response
}
