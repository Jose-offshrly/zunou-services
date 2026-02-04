import { TypedDocumentNode } from '@graphql-typed-document-node/core'
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { User } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface ToggleDirectMessageReactionResponse {
  toggleDirectMessageReaction: boolean
}

interface ToggleDirectMessageReactionVariables {
  input: {
    directMessageId: string
    reaction: string
  }
}

interface ToggleDirectMessageReactionWithThreadIdInput {
  directMessageId: string
  reaction: string
  threadId: string
  organizationId: string
}

// DirectMessageGroupedReaction type (matching the GraphQL schema)
interface DirectMessageGroupedReaction {
  reaction: string
  count: number
  users: User[]
}

// DirectMessage type for optimistic updates
interface DirectMessageForReaction {
  id: string
  groupedReactions?: DirectMessageGroupedReaction[]
}

const toggleDirectMessageReaction = graphql(/* GraphQL */ `
  mutation ToggleDirectMessageReaction(
    $input: ToggleDirectMessageReactionInput!
  ) {
    toggleDirectMessageReaction(input: $input)
  }
`) as TypedDocumentNode<
  ToggleDirectMessageReactionResponse,
  { input: ToggleDirectMessageReactionVariables['input'] }
>

// Helper function to update reactions optimistically
const updateReactions = (
  msg: DirectMessageForReaction,
  directMessageId: string,
  reaction: string,
  currentUser: User,
): DirectMessageForReaction => {
  if (msg.id !== directMessageId || !currentUser) return msg

  // Find existing grouped reaction for this emoji
  const existingGroupIndex = msg.groupedReactions?.findIndex(
    (gr: DirectMessageGroupedReaction) => gr.reaction === reaction,
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

export const useToggleDirectMessageReactionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  ToggleDirectMessageReactionResponse,
  Error,
  ToggleDirectMessageReactionWithThreadIdInput
> => {
  const { getToken, user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ToggleDirectMessageReactionWithThreadIdInput) => {
      const token = await getToken()

      // Remove threadId and organizationId before sending to API
      const {
        threadId: _threadId,
        organizationId: _organizationId,
        ...apiInput
      } = input

      return gqlClient(
        coreUrl,
        token,
      ).request<ToggleDirectMessageReactionResponse>(
        toggleDirectMessageReaction,
        {
          input: {
            directMessageId: apiInput.directMessageId,
            reaction: apiInput.reaction,
          },
        },
      )
    },

    // Rollback if error
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['directMessages', _variables.threadId],
          context.previousMessages,
        )
      }
    },

    // Optimistic update
    onMutate: async (input: ToggleDirectMessageReactionWithThreadIdInput) => {
      await queryClient.cancelQueries({
        queryKey: ['directMessages', input.threadId],
      })

      const previousMessages = queryClient.getQueryData<
        DirectMessageForReaction[]
      >(['directMessages', input.threadId])

      // Optimistically update directMessages cache
      queryClient.setQueryData<DirectMessageForReaction[]>(
        ['directMessages', input.threadId],
        (old) => {
          if (!old || !user) return old

          return old.map((msg) =>
            updateReactions(msg, input.directMessageId, input.reaction, user),
          )
        },
      )

      return {
        previousMessages,
      }
    },

    onSettled: (_data, _error, input) => {
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: ['directMessages', input.threadId],
      })
    },
  })
}
