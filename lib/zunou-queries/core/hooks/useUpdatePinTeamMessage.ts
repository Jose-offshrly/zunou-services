import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TeamMessage, TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePinTeamMessageResponse {
  pinTeamMessage: TeamMessage
}

interface UpdatePinTeamMessageVariables {
  teamMessageId: string
  pinned: boolean
}

interface UpdatePinTeamMessageWithPulseIdVariables
  extends UpdatePinTeamMessageVariables {
  pulseId: string
  replyTeamThreadId?: string
}

export const UPDATE_PIN_TEAM_MESSAGE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdatePinTeamMessage($teamMessageId: ID!, $pinned: Boolean!) {
    pinTeamMessage(teamMessageId: $teamMessageId, pinned: $pinned) {
      id
      teamThreadId
      isPinned
    }
  }
`) as TypedDocumentNode<
  UpdatePinTeamMessageResponse,
  UpdatePinTeamMessageVariables
>

export const useUpdatePinTeamMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePinTeamMessageResponse,
  Error,
  UpdatePinTeamMessageWithPulseIdVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: UpdatePinTeamMessageWithPulseIdVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePinTeamMessageResponse>(
        UPDATE_PIN_TEAM_MESSAGE_MUTATION,
        { pinned: variables.pinned, teamMessageId: variables.teamMessageId },
      )
    },

    // Rollback if error
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['teamMessages', _variables.pulseId],
          context.previousMessages,
        )
      }
      if (context?.previousThreadMessages) {
        // Restore all thread messages caches
        Object.entries(context.previousThreadMessages).forEach(
          ([key, data]) => {
            queryClient.setQueryData(JSON.parse(key), data)
          },
        )
      }
      if (
        context?.previousReplyThreadMessages &&
        _variables.replyTeamThreadId
      ) {
        queryClient.setQueryData(
          ['replyTeamThreadMessages', _variables.replyTeamThreadId],
          context.previousReplyThreadMessages,
        )
      }
    },

    // Optimistic update
    onMutate: async (variables: UpdatePinTeamMessageWithPulseIdVariables) => {
      await queryClient.cancelQueries({
        queryKey: ['teamMessages', variables.pulseId],
      })

      await queryClient.cancelQueries({
        queryKey: ['teamThreadMessages', variables.pulseId],
      })

      // Cancel replyTeamThreadMessages query if replyTeamThreadId exists
      if (variables.replyTeamThreadId) {
        await queryClient.cancelQueries({
          queryKey: ['replyTeamThreadMessages', variables.replyTeamThreadId],
        })
      }

      const previousMessages = queryClient.getQueryData<
        InfiniteData<TeamMessagePaginator>
      >(['teamMessages', variables.pulseId])

      // Get all thread messages queries for this pulseId
      const previousThreadMessages: Record<
        string,
        InfiniteData<TeamMessagePaginator> | undefined
      > = {}

      // Find all matching queries and save their previous state
      const queryCache = queryClient.getQueryCache()
      const matchingQueries = queryCache.findAll({
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            key[0] === 'teamThreadMessages' &&
            key[1] === variables.pulseId
          )
        },
      })

      matchingQueries.forEach((query) => {
        const queryKey = JSON.stringify(query.queryKey)
        previousThreadMessages[queryKey] = queryClient.getQueryData<
          InfiniteData<TeamMessagePaginator>
        >(query.queryKey)
      })

      // Get previous replyTeamThreadMessages if replyTeamThreadId exists
      const previousReplyThreadMessages = variables.replyTeamThreadId
        ? queryClient.getQueryData<InfiniteData<TeamMessagePaginator>>([
            'replyTeamThreadMessages',
            variables.replyTeamThreadId,
          ])
        : undefined

      // Optimistically update teamMessages cache
      queryClient.setQueryData<InfiniteData<TeamMessagePaginator>>(
        ['teamMessages', variables.pulseId],
        (old) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((msg) =>
                msg.id === variables.teamMessageId
                  ? { ...msg, isPinned: variables.pinned }
                  : msg,
              ),
            })),
          }
        },
      )

      // Optimistically update all teamThreadMessages caches
      matchingQueries.forEach((query) => {
        queryClient.setQueryData<InfiniteData<TeamMessagePaginator>>(
          query.queryKey,
          (old) => {
            if (!old) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  msg.id === variables.teamMessageId
                    ? { ...msg, isPinned: variables.pinned }
                    : msg,
                ),
              })),
            }
          },
        )
      })

      // Optimistically update replyTeamThreadMessages cache if replyTeamThreadId exists
      if (variables.replyTeamThreadId) {
        queryClient.setQueryData<InfiniteData<TeamMessagePaginator>>(
          ['replyTeamThreadMessages', variables.replyTeamThreadId],
          (old) => {
            if (!old) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  msg.id === variables.teamMessageId
                    ? { ...msg, isPinned: variables.pinned }
                    : msg,
                ),
              })),
            }
          },
        )
      }

      return {
        previousMessages,
        previousReplyThreadMessages,
        previousThreadMessages,
      }
    },

    onSettled: (_data, _error, variables) => {
      // Invalidate replyTeamThreadMessages if replyTeamThreadId exists
      if (variables.replyTeamThreadId) {
        queryClient.invalidateQueries({
          queryKey: ['replyTeamThreadMessages', variables.replyTeamThreadId],
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: ['teamMessages', variables.pulseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['teamThreadTopics', variables.pulseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['teamThreadMessages', variables.pulseId],
        })
      }
    },

    // Refetch after success
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: ['pinnedTeamMessages', response.pinTeamMessage.teamThreadId],
      })
    },
  })
}
