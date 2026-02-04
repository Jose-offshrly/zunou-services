import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

import type {
  DirectMessage,
  GetOrCreateDirectMessageThreadResponse,
} from './useGetOrCreateDirectMessageThreadMutation'

interface DirectMessageWithPin {
  id: string
  directMessageThreadId: string
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
  deletedAt?: string | null
  isRead: boolean
  isPinned: boolean
  repliedToMessageId?: string | null
}

interface UpdatePinDirectMessageResponse {
  pinDirectMessage: DirectMessageWithPin
}

interface UpdatePinDirectMessageVariables {
  directMessageId: string
  pinned: boolean
}

interface UpdatePinDirectMessageWithThreadIdVariables
  extends UpdatePinDirectMessageVariables {
  directMessageThreadId: string
  organizationId: string
}

interface DirectMessagePaginator {
  data: DirectMessageWithPin[]
  paginatorInfo: {
    count: number
    currentPage: number
    firstItem: number
    hasMorePages: boolean
    lastItem: number
    lastPage: number
    perPage: number
    total: number
  }
  threadId: string
}

export const UPDATE_PIN_DIRECT_MESSAGE_MUTATION = graphql(/* GraphQL */ `
  mutation PinDirectMessage($directMessageId: ID!, $pinned: Boolean!) {
    pinDirectMessage(directMessageId: $directMessageId, pinned: $pinned) {
      id
      directMessageThreadId
      content
      createdAt
      updatedAt
      isEdited
      deletedAt
      isRead
      isPinned
      repliedToMessageId
    }
  }
`) as TypedDocumentNode<
  UpdatePinDirectMessageResponse,
  UpdatePinDirectMessageVariables
>

export const useUpdatePinDirectMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePinDirectMessageResponse,
  Error,
  UpdatePinDirectMessageWithThreadIdVariables
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      variables: UpdatePinDirectMessageWithThreadIdVariables,
    ) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePinDirectMessageResponse>(
        UPDATE_PIN_DIRECT_MESSAGE_MUTATION,
        {
          directMessageId: variables.directMessageId,
          pinned: variables.pinned,
        },
      )
    },

    // Rollback if error
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['directMessages', _variables.directMessageThreadId],
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
    },

    // Optimistic update
    onMutate: async (
      variables: UpdatePinDirectMessageWithThreadIdVariables,
    ) => {
      // Cancel all related queries to prevent race conditions
      await queryClient.cancelQueries({
        queryKey: ['directMessages', variables.directMessageThreadId],
      })

      // Cancel all getOrCreateDirectMessageThread queries for this organizationId
      await queryClient.cancelQueries({
        queryKey: ['getOrCreateDirectMessageThread', variables.organizationId],
      })

      // Save previous state for rollback
      const previousMessages = queryClient.getQueryData<
        InfiniteData<DirectMessagePaginator>
      >(['directMessages', variables.directMessageThreadId])

      // Get all getOrCreateDirectMessageThread queries for this organizationId
      // Find all matching queries and save their previous state
      const queryCache = queryClient.getQueryCache()
      const matchingQueries = queryCache.findAll({
        predicate: (query) => {
          const key = query.queryKey
          return (
            Array.isArray(key) &&
            key[0] === 'getOrCreateDirectMessageThread' &&
            key[1] === variables.organizationId
          )
        },
      })

      const previousThreadMessages: Record<string, unknown> = {}
      matchingQueries.forEach((query) => {
        const queryKey = JSON.stringify(query.queryKey)
        previousThreadMessages[queryKey] = queryClient.getQueryData(
          query.queryKey,
        )
      })

      // Optimistically update directMessages cache
      queryClient.setQueryData<InfiniteData<DirectMessagePaginator>>(
        ['directMessages', variables.directMessageThreadId],
        (old) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((msg) =>
                msg.id === variables.directMessageId
                  ? { ...msg, isPinned: variables.pinned }
                  : msg,
              ),
            })),
          }
        },
      )

      // Optimistically update all getOrCreateDirectMessageThread caches
      // The query returns InfiniteData format with pages array
      matchingQueries.forEach((query) => {
        queryClient.setQueryData(
          query.queryKey,
          (
            old:
              | InfiniteData<
                  GetOrCreateDirectMessageThreadResponse['getOrCreateDirectMessageThread']
                >
              | undefined,
          ) => {
            if (!old) return old

            // Handle infinite query format (the actual format used by useInfiniteQuery)
            const updatedPages = old.pages.map((page) => {
              // Only update if this page's threadId matches the message's threadId
              if (page.threadId !== variables.directMessageThreadId) {
                return page
              }

              return {
                ...page,
                data: page.data.map((msg: DirectMessage) =>
                  msg.id === variables.directMessageId
                    ? { ...msg, isPinned: variables.pinned }
                    : msg,
                ),
              }
            })

            return {
              ...old,
              pages: updatedPages,
            }
          },
        )
      })

      return {
        previousMessages,
        previousThreadMessages,
      }
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['directMessages', variables.directMessageThreadId],
      })
      queryClient.invalidateQueries({
        queryKey: ['getOrCreateDirectMessageThread', variables.organizationId],
      })
    },

    // Refetch after success
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: [
          'pinnedDirectMessages',
          response.pinDirectMessage.directMessageThreadId,
        ],
      })
    },
  })
}
