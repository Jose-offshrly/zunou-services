import type { TypedDocumentNode } from '@graphql-typed-document-node/core'
import type { InfiniteData, UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { TeamMessagePaginator } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteTeamMessageResponse {
  deleteTeamMessage: boolean
}

interface DeleteTeamMessageVariables {
  teamMessageId: string
  pulseId?: string
  replyTeamThreadId?: string
}

interface MutationContext {
  previousMessages: InfiniteData<TeamMessagePaginator> | undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previousReplyThreadMessages?: any
}

interface GraphQLInput {
  input: {
    teamMessageId: string
  }
}

const deleteTeamMessageMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteTeamMessage($input: DeleteTeamMessageInput!) {
    deleteTeamMessage(input: $input)
  }
`) as TypedDocumentNode<DeleteTeamMessageResponse, GraphQLInput>

export const useDeleteTeamMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteTeamMessageResponse,
  Error,
  DeleteTeamMessageVariables,
  MutationContext
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      teamMessageId,
      pulseId: _pulseId,
      replyTeamThreadId: _replyTeamThreadId,
    }: DeleteTeamMessageVariables) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteTeamMessageResponse>(
        deleteTeamMessageMutationDocument,
        { input: { teamMessageId } },
      )
    },
    onError: (_, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['teamMessages', variables.pulseId],
          context.previousMessages,
        )
      }

      if (context?.previousReplyThreadMessages && variables.replyTeamThreadId) {
        queryClient.setQueryData(
          ['replyTeamThreadMessages', variables.replyTeamThreadId],
          context.previousReplyThreadMessages,
        )
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: ['teamMessages', variables.pulseId],
      })

      if (variables.replyTeamThreadId) {
        await queryClient.cancelQueries({
          queryKey: ['replyTeamThreadMessages', variables.replyTeamThreadId],
        })
      }

      const previousMessages = queryClient.getQueryData<
        InfiniteData<TeamMessagePaginator>
      >(['teamMessages', variables.pulseId])

      const previousReplyThreadMessages = variables.replyTeamThreadId
        ? queryClient.getQueryData<InfiniteData<TeamMessagePaginator>>([
            'replyTeamThreadMessages',
            variables.replyTeamThreadId,
          ])
        : undefined

      queryClient.setQueryData(
        ['teamMessages', variables.pulseId],
        (old: InfiniteData<TeamMessagePaginator> | undefined) => {
          if (!old) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) =>
                message.id === variables.teamMessageId
                  ? { ...message, isDeleted: true }
                  : message,
              ),
            })),
          }
        },
      )

      if (variables.replyTeamThreadId) {
        queryClient.setQueryData(
          ['replyTeamThreadMessages', variables.replyTeamThreadId],
          (old: InfiniteData<TeamMessagePaginator> | undefined) => {
            if (!old) return old
            return {
              ...old,
              data: [],
            }
          },
        )
      }

      return { previousMessages, previousReplyThreadMessages }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['teamMessages', variables.pulseId],
      })
      if (variables.replyTeamThreadId) {
        queryClient.invalidateQueries({
          queryKey: ['replyTeamThreadMessages', variables.replyTeamThreadId],
        })
      }
    },
  })
}
