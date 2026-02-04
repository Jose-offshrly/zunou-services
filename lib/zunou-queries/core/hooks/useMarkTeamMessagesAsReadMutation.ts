import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface MarkTeamMessagesAsReadResponse {
  markTeamMessagesAsRead: boolean
}

interface MarkTeamMessagesAsReadVariables {
  threadId: string
  topicId?: string
  organizationId?: string
  pulseId?: string
}

export const MARK_TEAM_MESSAGES_AS_READ_MUTATION = graphql(/* GraphQL */ `
  mutation MarkTeamMessagesAsRead($threadId: ID!, $topicId: ID) {
    markTeamMessagesAsRead(threadId: $threadId, topicId: $topicId)
  }
`) as TypedDocumentNode<
  MarkTeamMessagesAsReadResponse,
  MarkTeamMessagesAsReadVariables
>

/**
 * Hook to mark all team messages in a thread as read
 */
export const useMarkTeamMessagesAsReadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  MarkTeamMessagesAsReadResponse,
  Error,
  MarkTeamMessagesAsReadVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: MarkTeamMessagesAsReadVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<MarkTeamMessagesAsReadResponse>(
        MARK_TEAM_MESSAGES_AS_READ_MUTATION,
        { threadId: variables.threadId, topicId: variables.topicId },
      )
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to refresh the unread team messages data
      queryClient.invalidateQueries({
        queryKey: ['unreadTeamMessages'],
      })

      queryClient.invalidateQueries({
        queryKey: [
          'topics',
          'TEAM_CHAT',
          variables?.pulseId,
          variables?.organizationId,
        ],
      })

      // Also invalidate any team thread to update their unread count
      queryClient.invalidateQueries({
        queryKey: ['teamMessageThread', variables.threadId],
      })

      // Invalidate team messages for the specific thread
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', variables.threadId],
      })
    },
  })
}
