import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreateReplyTeamThreadInput,
  ReplyTeamThread,
  TeamMessagePaginator,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateReplyTeamThreadResponse {
  createReplyTeamThread: ReplyTeamThread
}

interface MutationContext {
  previousMessages: InfiniteData<TeamMessagePaginator> | undefined
}

const createReplyTeamThreadMutationDocument = graphql(/* GraphQL */ `
  mutation CreateReplyTeamThread($input: CreateReplyTeamThreadInput!) {
    createReplyTeamThread(input: $input) {
      replyTeamThreadId
      teamThreadId
      userId
      content
      createdAt
      updatedAt
    }
  }
`)

export const useCreateReplyTeamThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateReplyTeamThreadResponse,
  Error,
  CreateReplyTeamThreadInput,
  MutationContext
> => {
  const { getToken, user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateReplyTeamThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateReplyTeamThreadResponse>(
        createReplyTeamThreadMutationDocument,
        { input },
      )
    },
    onError: (_, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['teamMessages', variables.pulseId],
          context.previousMessages,
        )
      }
    },
    onMutate: async (newThread) => {
      await queryClient.cancelQueries({
        queryKey: ['teamMessages', newThread.pulseId],
      })

      const previousMessages = queryClient.getQueryData<
        InfiniteData<TeamMessagePaginator>
      >(['teamMessages', newThread.pulseId])

      queryClient.setQueryData(
        ['teamMessages', newThread.pulseId],
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
                      content: newThread.content,
                      createdAt: new Date().toISOString(),
                      gravatar: user?.gravatar,
                      id: 'temp-' + Date.now().toString(),
                      isParentReply: true,
                      metadata: { status: 'PENDING' },
                      name: user?.name,
                      pending: true,
                      replyTeamThreadId: 'temp-reply-' + Date.now().toString(),
                      teamThreadId: newThread.teamThreadId,
                      updatedAt: new Date().toISOString(),
                      user: {
                        gravatar: user?.gravatar,
                        id: user?.id,
                        name: user?.name,
                      },
                      userId: newThread.userId,
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
        queryKey: ['teamMessages', variables.pulseId],
      })

      queryClient.invalidateQueries({
        queryKey: ['replyTeamThreadMessages', variables.pulseId],
      })

      queryClient.invalidateQueries({
        queryKey: ['teamThread'],
      })
    },
  })
}
