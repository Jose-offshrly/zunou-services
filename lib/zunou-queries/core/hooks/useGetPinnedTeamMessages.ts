import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseQueryResult } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface GetPinnedTeamMessagesResponse {
  pinnedTeamMessages: TeamMessagePaginator
}

interface GetPinnedTeamMessagesVariables {
  teamThreadId: string
  organizationId: string
  page?: number
}

export const GET_PINNED_TEAM_MESSAGES_QUERY = graphql(/* GraphQL */ `
  query GetPinnedTeamMessages(
    $teamThreadId: ID!
    $organizationId: ID!
    $page: Int
  ) {
    pinnedTeamMessages(
      teamThreadId: $teamThreadId
      organizationId: $organizationId
      page: $page
    ) {
      teamThreadId
      data {
        id
        teamThreadId
        topicId
        userId
        replyTeamThreadId
        isParentReply
        content
        metadata {
          excerpt
          status
        }
        createdAt
        updatedAt
        isEdited
        isDeleted
        deletedAt
        user {
          id
          name
          email
          gravatar
        }
        isRead
        isPinned
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
        topic {
          id
          name
        }
      }
      paginatorInfo {
        count
        currentPage
        hasMorePages
      }
      unreadCount
    }
  }
`) as TypedDocumentNode<
  GetPinnedTeamMessagesResponse,
  GetPinnedTeamMessagesVariables
>

export const useGetPinnedTeamMessages = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<GetPinnedTeamMessagesResponse> => {
  const { isAuthenticated, getToken } = useAuthContext()

  return useQuery({
    ...options,
    enabled:
      isAuthenticated &&
      !!variables?.teamThreadId &&
      !!variables?.organizationId,
    queryFn: async () => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<GetPinnedTeamMessagesResponse>(
        GET_PINNED_TEAM_MESSAGES_QUERY,
        variables,
      )
    },
    queryKey: [
      'pinnedTeamMessages',
      variables?.teamThreadId,
      variables?.organizationId,
      variables?.page,
    ],
  })
}
