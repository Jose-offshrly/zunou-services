import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ID } from 'graphql-ws'

interface DeleteDirectMessageResponse {
  deleteDirectMessage: {
    id: string
    content: string
    createdAt: string
    updatedAt: string
    isEdited: boolean
    deletedAt: string
  }
}

interface DeleteDirectMessageInput {
  directMessageId: ID
  organizationId: ID
}

const DELETE_DIRECT_MESSAGE_MUTATION = graphql(/* GraphQL */ `
  mutation DeleteDirectMessage($directMessageId: ID!) {
    deleteDirectMessage(directMessageId: $directMessageId) {
      id
      content
      createdAt
      updatedAt
      isEdited
      deletedAt
    }
  }
`)

export const useDeleteDirectMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteDirectMessageResponse,
  Error,
  DeleteDirectMessageInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ directMessageId }: DeleteDirectMessageInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteDirectMessageResponse>(
        DELETE_DIRECT_MESSAGE_MUTATION,
        {
          directMessageId,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['directMessages'],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessage', variables.directMessageId],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessageThreads'],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessageThread', variables.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessageThreadMessages', variables.directMessageId],
      })
    },
  })
}
