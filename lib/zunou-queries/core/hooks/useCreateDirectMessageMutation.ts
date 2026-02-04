import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateDirectMessageInput,
  CreateDirectMessageMutation,
  CreateDirectMessageMutationVariables,
  DirectMessage,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DirectMessagePaginator {
  data: DirectMessage[]
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
}

interface MutationContext {
  previousMessages: InfiniteData<DirectMessagePaginator> | undefined
}

const createDirectMessageMutationDocument = graphql(/* GraphQL */ `
  mutation CreateDirectMessage($input: CreateDirectMessageInput!) {
    createDirectMessage(input: $input) {
      id
      directMessageThreadId
      sender {
        id
        name
        email
        gravatar
      }
      content
      createdAt
      updatedAt
    }
  }
`)

export const useCreateDirectMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateDirectMessageMutation,
  Error,
  CreateDirectMessageInput,
  MutationContext
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: CreateDirectMessageInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<
        CreateDirectMessageMutation,
        CreateDirectMessageMutationVariables
      >(createDirectMessageMutationDocument, { input: variables })
    },
    onError: (_, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['directMessages', newMessage.directMessageThreadId],
          context.previousMessages,
        )
      }
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({
        queryKey: ['directMessages', newMessage.directMessageThreadId],
      })

      const previousMessages = queryClient.getQueryData<
        InfiniteData<DirectMessagePaginator>
      >(['directMessages', newMessage.directMessageThreadId])

      queryClient.setQueryData(
        ['directMessages', newMessage.directMessageThreadId],
        (old: InfiniteData<DirectMessagePaginator> | undefined) => {
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
                      directMessageThreadId: newMessage.directMessageThreadId,
                      id: 'temp-' + Date.now().toString(),
                      sender: null,
                      senderId: null,
                      updatedAt: new Date().toISOString(),
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
      return { previousMessages }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['directMessages', variables.directMessageThreadId],
      })
      queryClient.invalidateQueries({
        queryKey: ['getOrCreateDirectMessageThread', variables.organizationId],
      })
    },
  })
}
