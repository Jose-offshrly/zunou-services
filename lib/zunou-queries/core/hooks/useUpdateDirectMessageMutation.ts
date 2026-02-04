import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  DirectMessage,
  UpdateDirectMessageInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateDirectMessageResponse {
  updateDirectMessage: DirectMessage
}

const UPDATE_DIRECT_MESSAGE_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateDirectMessage($input: UpdateDirectMessageInput!) {
    updateDirectMessage(input: $input) {
      id
      content
      createdAt
      updatedAt
    }
  }
`)

export const useUpdateDirectMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateDirectMessageResponse,
  Error,
  UpdateDirectMessageInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateDirectMessageInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateDirectMessageResponse>(
        UPDATE_DIRECT_MESSAGE_MUTATION,
        { input },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['getOrCreateDirectMessageThread', variables.organizationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessages', variables.directMessageId],
      })
      queryClient.invalidateQueries({
        queryKey: ['directMessage', variables.directMessageId],
      })
    },
  })
}
