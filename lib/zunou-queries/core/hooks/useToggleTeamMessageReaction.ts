import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  InfiniteData,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  TeamMessage,
  TeamMessageGroupedReaction,
  TeamMessagePaginator,
  ToggleTeamMessageReactionInput,
  User,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ToggleTeamMessageReactionResponse {
  toggleTeamMessageReaction: boolean
}

interface ToggleTeamMessageReactionVariables {
  input: ToggleTeamMessageReactionInput
}

interface ToggleTeamMessageReactionWithPulseIdInput
  extends ToggleTeamMessageReactionInput {
  pulseId: string
  replyTeamThreadId?: string
}

const toggleTeamMessageReaction = graphql(/* GraphQL */ `
  mutation ToggleTeamMessageReaction($input: ToggleTeamMessageReactionInput!) {
    toggleTeamMessageReaction(input: $input)
  }
`) as TypedDocumentNode<
  ToggleTeamMessageReactionResponse,
  ToggleTeamMessageReactionVariables
>

// Helper function to update reactions optimistically
const updateReactions = (
  msg: TeamMessage,
  teamMessageId: string,
  reaction: string,
  currentUser: User,
) => {
  if (msg.id !== teamMessageId || !currentUser) return msg

  // Find existing grouped reaction for this emoji
  const existingGroupIndex = msg.groupedReactions?.findIndex(
    (gr: TeamMessageGroupedReaction) => gr.reaction === reaction,
  )

  const updatedGroupedReactions = [...(msg.groupedReactions || [])]

  if (existingGroupIndex !== undefined && existingGroupIndex >= 0) {
    const existingGroup = updatedGroupedReactions[existingGroupIndex]

    // Check if current user already reacted
    const userHasReacted = existingGroup.users.some(
      (u: User) => u.id === currentUser.id,
    )

    if (userHasReacted) {
      // Remove user's reaction
      const updatedUsers = existingGroup.users.filter(
        (u: User) => u.id !== currentUser.id,
      )

      if (updatedUsers.length === 0) {
        // Remove the entire group if no users left
        updatedGroupedReactions.splice(existingGroupIndex, 1)
      } else {
        // Update the group with decremented count
        updatedGroupedReactions[existingGroupIndex] = {
          ...existingGroup,
          count: existingGroup.count - 1,
          users: updatedUsers,
        }
      }
    } else {
      // Add user's reaction to existing group
      updatedGroupedReactions[existingGroupIndex] = {
        ...existingGroup,
        count: existingGroup.count + 1,
        users: [...existingGroup.users, currentUser],
      }
    }
  } else {
    // Create new grouped reaction
    updatedGroupedReactions.push({
      count: 1,
      reaction: reaction,
      users: [currentUser],
    })
  }

  // Sort reactions by Unicode value
  updatedGroupedReactions.sort((a, b) => {
    const codePointA = a.reaction.codePointAt(0) || 0
    const codePointB = b.reaction.codePointAt(0) || 0
    return codePointA - codePointB
  })

  return {
    ...msg,
    groupedReactions: updatedGroupedReactions,
  }
}

export const useToggleTeamMessageReactionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  ToggleTeamMessageReactionResponse,
  Error,
  ToggleTeamMessageReactionWithPulseIdInput
> => {
  const { getToken, user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ToggleTeamMessageReactionWithPulseIdInput) => {
      const token = await getToken()

      // Remove pulseId and replyTeamThreadId before sending to API
      const {
        pulseId: _pulseId,
        replyTeamThreadId: _replyTeamThreadId,
        ...apiInput
      } = input

      return gqlClient(
        coreUrl,
        token,
      ).request<ToggleTeamMessageReactionResponse>(toggleTeamMessageReaction, {
        input: apiInput,
      })
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
    onMutate: async (input: ToggleTeamMessageReactionWithPulseIdInput) => {
      await queryClient.cancelQueries({
        queryKey: ['teamMessages', input.pulseId],
      })
      await queryClient.cancelQueries({
        queryKey: ['teamThreadMessages', input.pulseId],
      })

      // Cancel replyTeamThreadMessages query if replyTeamThreadId exists
      if (input.replyTeamThreadId) {
        await queryClient.cancelQueries({
          queryKey: ['replyTeamThreadMessages', input.replyTeamThreadId],
        })
      }

      const previousMessages = queryClient.getQueryData<
        InfiniteData<TeamMessagePaginator>
      >(['teamMessages', input.pulseId])

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
            key[1] === input.pulseId
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
      const previousReplyThreadMessages = input.replyTeamThreadId
        ? queryClient.getQueryData<InfiniteData<TeamMessagePaginator>>([
            'replyTeamThreadMessages',
            input.replyTeamThreadId,
          ])
        : undefined

      // Optimistically update teamMessages cache
      queryClient.setQueryData<InfiniteData<TeamMessagePaginator>>(
        ['teamMessages', input.pulseId],
        (old) => {
          if (!old || !user) return old

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((msg) =>
                updateReactions(msg, input.teamMessageId, input.reaction, user),
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
            if (!old || !user) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  updateReactions(
                    msg,
                    input.teamMessageId,
                    input.reaction,
                    user,
                  ),
                ),
              })),
            }
          },
        )
      })

      // Optimistically update replyTeamThreadMessages cache if replyTeamThreadId exists
      if (input.replyTeamThreadId) {
        queryClient.setQueryData<InfiniteData<TeamMessagePaginator>>(
          ['replyTeamThreadMessages', input.replyTeamThreadId],
          (old) => {
            if (!old || !user) return old

            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((msg) =>
                  updateReactions(
                    msg,
                    input.teamMessageId,
                    input.reaction,
                    user,
                  ),
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

    onSettled: (_data, _error, input) => {
      // Invalidate replyTeamThreadMessages if replyTeamThreadId exists
      if (input.replyTeamThreadId) {
        queryClient.invalidateQueries({
          queryKey: ['replyTeamThreadMessages', input.replyTeamThreadId],
        })
      } else {
        queryClient.invalidateQueries({
          queryKey: ['teamMessages', input.pulseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['teamThreadTopics', input.pulseId],
        })
        queryClient.invalidateQueries({
          queryKey: ['teamThreadMessages', input.pulseId],
        })
      }
    },
  })
}
