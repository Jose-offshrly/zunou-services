import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateCompletionInput,
  Message,
  MessagePaginator,
  MessageRole,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateCompletionResponse {
  createCompletion: Message[]
}

const createCompletionMutationDocument = graphql(/* GraphQL */ `
  mutation CreateCompletion($input: CreateCompletionInput!) {
    createCompletion(input: $input) {
      id
      content
      status
    }
  }
`)

export const useCreateCompletionMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateCompletionResponse,
  Error,
  CreateCompletionInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateCompletionInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateCompletionResponse>(
        createCompletionMutationDocument,
        { input },
      )
    },
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({
        queryKey: ['messages', newMessage.organizationId, newMessage.threadId],
      })

      const previousMessages = queryClient.getQueryData([
        'messages',
        newMessage.organizationId,
        newMessage.threadId,
      ])

      queryClient.setQueryData(
        ['messages', newMessage.organizationId, newMessage.threadId],
        (old: InfiniteData<MessagePaginator> | undefined) => {
          if (!old) return old

          return {
            ...old,
            pages: old.pages.map((page, index) => {
              if (index === 0) {
                return {
                  ...page,
                  data: [
                    {
                      ...page.data[0],
                      content: newMessage.message,
                      createdAt: Date.now().toString(),
                      id: 'temp-' + Date.now().toString(),
                      role: MessageRole.User,
                      updatedAt: Date.now().toString(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['messages'],
      })
    },
  })
}
