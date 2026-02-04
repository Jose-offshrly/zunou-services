import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteSavedMessageResponse {
  deleteSavedMessage: boolean
}

const deleteSavedMessageDocument = graphql(/* GraphQL */ `
  mutation deleteSavedMessage($savedMessageId: String!) {
    deleteSavedMessage(savedMessageId: $savedMessageId)
  }
`)

export const useDeleteSavedMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteSavedMessageResponse,
  Error,
  { savedMessageId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ savedMessageId }: { savedMessageId: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteSavedMessageResponse>(
        deleteSavedMessageDocument,
        {
          savedMessageId,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['savedMessages'],
      })
      queryClient.invalidateQueries({
        queryKey: ['messages'],
      })
    },
  })
}
