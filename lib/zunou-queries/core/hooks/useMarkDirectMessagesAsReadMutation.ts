import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface MarkDirectMessagesAsReadResponse {
  markDirectMessagesAsRead: boolean
}

interface MarkDirectMessagesAsReadVariables {
  threadId: string
}

export const MARK_DIRECT_MESSAGES_AS_READ_MUTATION = graphql(/* GraphQL */ `
  mutation MarkDirectMessagesAsRead($threadId: ID!) {
    markDirectMessagesAsRead(threadId: $threadId)
  }
`) as TypedDocumentNode<
  MarkDirectMessagesAsReadResponse,
  MarkDirectMessagesAsReadVariables
>

export const useMarkDirectMessagesAsReadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  MarkDirectMessagesAsReadResponse,
  Error,
  { threadId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId }: { threadId: string }) => {
      const token = await getToken()

      return gqlClient(
        coreUrl,
        token,
      ).request<MarkDirectMessagesAsReadResponse>(
        MARK_DIRECT_MESSAGES_AS_READ_MUTATION,
        {
          threadId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['unreadDirectMessages'],
      })

      queryClient.invalidateQueries({
        queryKey: ['directMessageThread'],
      })

      queryClient.invalidateQueries({
        queryKey: ['directMessageThread', variables.threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['directMessages', variables.threadId],
      })

      queryClient.invalidateQueries({
        queryKey: ['directMessageThreadUnreadCount'],
      })
    },
  })
}
