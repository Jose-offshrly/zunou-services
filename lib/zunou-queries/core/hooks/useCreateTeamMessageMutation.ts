import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateTeamMessageInput,
  ReplyTeamThreadPaginator,
  TeamMessage,
  TeamMessagePaginator,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateTeamMessageResponse {
  createTeamMessage: TeamMessage
}

interface MutationContext {
  previousMessages: InfiniteData<TeamMessagePaginator> | undefined
  previousReplyMessages: InfiniteData<ReplyTeamThreadPaginator> | undefined
}

const createTeamMessageMutationDocument = graphql(/* GraphQL */ `
  mutation CreateTeamMessage($input: CreateTeamMessageInput!) {
    createTeamMessage(input: $input) {
      id
      teamThreadId
      topicId
      userId
      content
      createdAt
      updatedAt
      user {
        id
        name
        gravatar
      }
      topic {
        id
        name
      }
    }
  }
`)

interface CreateTeamMessageVariables extends CreateTeamMessageInput {
  pulseId?: string
}

export const useCreateTeamMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateTeamMessageResponse,
  Error,
  CreateTeamMessageVariables,
  MutationContext
> => {
  const { getToken, user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: CreateTeamMessageVariables) => {
      try {
        const token = await getToken()

        const { pulseId: _pulseId, ...input } = variables

        if (!input.teamThreadId || !input.userId || !input.content) {
          throw new Error(
            'Missing required fields: teamThreadId, userId, or content',
          )
        }

        const result = await gqlClient(coreUrl, token).request(
          createTeamMessageMutationDocument,
          { input },
        )

        return result as CreateTeamMessageResponse
      } catch (error) {
        console.error('Error in mutationFn:', error)
        throw error
      }
    },
    onError: (_, newMessage, context) => {
      // Restore the appropriate query data based on message type
      const topicId = newMessage.topicId
      const pulseId = newMessage.pulseId

      if (newMessage.replyTeamThreadId && context?.previousReplyMessages) {
        queryClient.setQueryData(
          ['replyTeamThreadMessages', newMessage.replyTeamThreadId],
          context.previousReplyMessages,
        )
      } else if (context?.previousMessages) {
        queryClient.setQueryData(
          ['teamThreadMessages', pulseId, topicId || null],
          context.previousMessages,
        )
      }
    },
    onMutate: async (newMessage) => {
      const topicId = newMessage.topicId
      const pulseId = newMessage.pulseId

      const teamMessagesKey = ['teamThreadMessages', pulseId, topicId || null]
      const replyTeamThreadMessagesKey = [
        'replyTeamThreadMessages',
        newMessage.replyTeamThreadId,
      ]

      // Cancel only the relevant queries based on message type
      if (newMessage.replyTeamThreadId) {
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

      const previousReplyMessages = newMessage.replyTeamThreadId
        ? queryClient.getQueryData<InfiniteData<ReplyTeamThreadPaginator>>(
            replyTeamThreadMessagesKey,
          )
        : undefined

      // Update the appropriate query data based on message type
      if (newMessage.replyTeamThreadId) {
        // Handle reply thread messages
        queryClient.setQueryData(
          replyTeamThreadMessagesKey,
          (old: InfiniteData<ReplyTeamThreadPaginator> | undefined) => {
            if (!old) return old

            return {
              ...old,
              pages: old.pages.map((page, index) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: [
                      {
                        content: newMessage.content,
                        createdAt: new Date().toISOString(),
                        id: 'temp-' + Date.now().toString(),
                        isParentReply: false,
                        pending: true,
                        replyTeamThreadId: newMessage.replyTeamThreadId,
                        teamThreadId: newMessage.teamThreadId,
                        topicId: newMessage.topicId,
                        updatedAt: new Date().toISOString(),
                        user: user,
                        userId: newMessage.userId,
                      },
                      ...page.data,
                    ],
                  }
                }
                return page
              }),
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
              pages: old.pages.map((page, index) => {
                if (index === 0) {
                  return {
                    ...page,
                    data: [
                      {
                        content: newMessage.content,
                        createdAt: new Date().toISOString(),
                        files: [],
                        id: 'temp-' + Date.now().toString(),
                        isParentReply: false,
                        pending: true,
                        replyTeamThreadId: newMessage.replyTeamThreadId,
                        teamThreadId: newMessage.teamThreadId,
                        topicId: newMessage.topicId,
                        updatedAt: new Date().toISOString(),
                        user: user,
                        userId: newMessage.userId,
                      },
                      ...page.data,
                    ],
                  }
                }
                return page
              }),
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
            variables.topicId || undefined,
          ],
        })

        // Always invalidate teamThread as it might affect thread metadata
        queryClient.invalidateQueries({
          queryKey: ['teamThread'],
        })

        // Invalidate team thread topics so recent message and ordering update in menus/modals
        queryClient.invalidateQueries({
          queryKey: ['teamThreadTopics', variables.pulseId],
        })
      }
    },
  })
}
