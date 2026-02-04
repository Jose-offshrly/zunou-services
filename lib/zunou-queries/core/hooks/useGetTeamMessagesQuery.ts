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
  teamThreadMessages: TeamMessagePaginator
}

export const GET_TEAM_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query GetTeamMessages(
    $pulseId: ID!
    $organizationId: ID!
    $page: Int
    $unreadOnly: Boolean
  ) {
    teamThreadMessages(
      pulseId: $pulseId
      organizationId: $organizationId
      page: $page
      unreadOnly: $unreadOnly
    ) {
      teamThreadId
      data {
        id
        userId
        replyTeamThreadId
        content
        createdAt
        updatedAt
        isParentReply
        isDeleted
        isEdited
        user {
          id
          name
          gravatar
        }
        metadata {
          excerpt
          status
        }
        isPinned
        groupedReactions {
          reaction
          count
          users {
            id
            name
          }
        }
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
`) as TypedDocumentNode<QueryResponse, { pulseId: string; page?: number }>

export const useGetTeamMessagesQuery = ({
  coreUrl,
  variables,
}: QueryOptions): UseInfiniteQueryResult<
  InfiniteData<TeamMessagePaginator>
> => {
  const { isAuthenticated, getToken } = useAuthContext()

  const fetchTeamMessages = async ({
    pageParam = 1,
  }: {
    pageParam?: number
  }) => {
    const token = await getToken()

    const result = await gqlClient(coreUrl, token).request<QueryResponse>(
      GET_TEAM_MESSAGES_QUERY,
      { ...variables, page: pageParam },
    )

    return result.teamThreadMessages
  }

  const response = useInfiniteQuery({
    enabled: isAuthenticated,
    getNextPageParam: (lastPage) => {
      if (
        lastPage.paginatorInfo.hasMorePages &&
        lastPage.data.length > 0 &&
        lastPage.paginatorInfo.currentPage < lastPage.paginatorInfo.lastPage
      ) {
        return lastPage.paginatorInfo.currentPage + 1
      }

      return undefined
    },
    initialPageParam: 1,
    queryFn: fetchTeamMessages,
    queryKey: ['teamMessages', variables?.pulseId],
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
