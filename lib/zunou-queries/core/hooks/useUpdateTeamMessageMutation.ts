import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  ReplyTeamThreadPaginator,
  TeamMessage,
  TeamMessagePaginator,
  UpdateTeamMessageInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateTeamMessageResponse {
  updateTeamMessage: TeamMessage
}

interface MutationContext {
  previousMessages: InfiniteData<TeamMessagePaginator> | undefined
  previousReplyMessages: InfiniteData<ReplyTeamThreadPaginator> | undefined
}

const updateTeamMessageMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTeamMessage($input: UpdateTeamMessageInput!) {
    updateTeamMessage(input: $input) {
      id
      teamThreadId
      userId
      content
      createdAt
      updatedAt
      isParentReply
      replyTeamThreadId
      topicId
      user {
        id
        name
        gravatar
      }
      metadata {
        excerpt
        status
      }
    }
  }
`)

type UpdateTeamMessageVariables = UpdateTeamMessageInput & {
  pulseId?: string
  topicId?: string
  replyTeamThreadId?: string
}

export const useUpdateTeamMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTeamMessageResponse,
  Error,
  UpdateTeamMessageVariables,
  MutationContext
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pulseId: _pulseId,
      topicId: _topicId,
      replyTeamThreadId: _replyTeamThreadId,
      ...input
    }: UpdateTeamMessageVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateTeamMessageResponse>(
        updateTeamMessageMutationDocument,
        { input },
      )
    },
    onError: (_, variables, context) => {
      // Restore the appropriate query data based on message type
      const topicId = variables.topicId
      const pulseId = variables.pulseId

      if (variables.replyTeamThreadId && context?.previousReplyMessages) {
        queryClient.setQueryData(
          ['replyTeamThreadMessages', variables.replyTeamThreadId],
          context.previousReplyMessages,
        )
      } else if (context?.previousMessages) {
        queryClient.setQueryData(
          ['teamThreadMessages', pulseId, topicId || null],
          context.previousMessages,
        )
      }
    },
    onMutate: async (variables) => {
      const topicId = variables.topicId
      const pulseId = variables.pulseId

      const teamMessagesKey = ['teamThreadMessages', pulseId, topicId || null]
      const replyTeamThreadMessagesKey = [
        'replyTeamThreadMessages',
        variables.replyTeamThreadId,
      ]

      // Cancel only the relevant queries based on message type
      if (variables.replyTeamThreadId) {
        await queryClient.cancelQueries({
          queryKey: replyTeamThreadMessagesKey,
        })
      } else {
        await queryClient.cancelQueries({
          queryKey: teamMessagesKey,
        })
      }

      // Get previous data for both query types
      const previousMessages =
        queryClient.getQueryData<InfiniteData<TeamMessagePaginator>>(
          teamMessagesKey,
        )

      const previousReplyMessages = variables.replyTeamThreadId
        ? queryClient.getQueryData<InfiniteData<ReplyTeamThreadPaginator>>(
            replyTeamThreadMessagesKey,
          )
        : undefined

      // Update the appropriate query data based on message type
      if (variables.replyTeamThreadId) {
        // Handle reply thread messages
        queryClient.setQueryData(
          replyTeamThreadMessagesKey,
          (old: InfiniteData<ReplyTeamThreadPaginator> | undefined) => {
            if (!old) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  msg.id === variables.teamMessageId
                    ? {
                        ...msg,
                        content: variables.content,
                        isEdited: true,
                        updatedAt: new Date().toISOString(),
                      }
                    : msg,
                ),
              })),
            }
          },
        )
      } else {
        // Handle regular team messages
        queryClient.setQueryData(
          teamMessagesKey,
          (old: InfiniteData<TeamMessagePaginator> | undefined) => {
            if (!old) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg: TeamMessage) =>
                  msg.id === variables.teamMessageId
                    ? {
                        ...msg,
                        content: variables.content,
                        isEdited: true,
                        updatedAt: new Date().toISOString(),
                      }
                    : msg,
                ),
              })),
            }
          },
        )
      }

      return { previousMessages, previousReplyMessages }
    },
    onSuccess: (_, variables) => {
      if (variables.replyTeamThreadId) {
        // Only invalidate reply thread messages if this was a reply
        queryClient.invalidateQueries({
          queryKey: ['replyTeamThreadMessages', variables.replyTeamThreadId],
        })
      } else {
        // Only invalidate team messages if this was a regular message
        queryClient.invalidateQueries({
          queryKey: [
            'teamThreadMessages',
            variables.pulseId,
            variables.topicId || null,
          ],
        })
      }

      // Always invalidate teamThread as it might affect thread metadata
      queryClient.invalidateQueries({
        queryKey: ['teamThread'],
      })

      // Invalidate team thread topics so recent message and ordering update in menus/modals
      queryClient.invalidateQueries({
        queryKey: ['teamThreadTopics', variables.pulseId],
      })
    },
  })
}
