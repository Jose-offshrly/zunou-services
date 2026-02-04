import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { QueryOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface QueryResponse {
  jumpTeamThreadMessage: TeamMessagePaginator
}

const jumpTeamThreadMessageQueryDocument = graphql(/* GraphQL */ `
  query JumpTeamThreadMessage(
    $pulseId: ID!
    $organizationId: ID!
    $topicId: ID
    $messageId: ID!
    $replyTeamThreadId: ID
  ) {
    jumpTeamThreadMessage(
      pulseId: $pulseId
      organizationId: $organizationId
      topicId: $topicId
      messageId: $messageId
      replyTeamThreadId: $replyTeamThreadId
    ) {
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
      data {
        id
        teamThreadId
        topicId
        userId
        replyTeamThreadId
        repliedToMessageId
        isParentReply
        content
        createdAt
        updatedAt
        isEdited
        isDeleted
        deletedAt
        isRead
        isPinned
      }
    }
  }
`)

export const useJumpTeamThreadMessageQuery = ({
  coreUrl,
  variables,
  ...options
}: QueryOptions): UseQueryResult<QueryResponse> => {
  const { getToken } = useAuthContext()

  const response = useQuery({
    ...options,
    queryFn: async () => {
      const token = await getToken()

      const result = await gqlClient(coreUrl, token).request<QueryResponse>(
        jumpTeamThreadMessageQueryDocument,
        variables,
      )

      return result
    },
    queryKey: [
      'jumpTeamThreadMessage',
      variables?.pulseId,
      variables?.organizationId,
      variables?.topicId,
      variables?.messageId,
      variables?.replyTeamThreadId,
    ],
  })

  return response
}
