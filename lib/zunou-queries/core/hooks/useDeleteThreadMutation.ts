import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DeleteThreadInput, Thread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteThreadResponse {
  thread: Thread
}

const deleteThreadMutationDocument = graphql(/* GraphQL */ `
  mutation deleteThread($input: DeleteThreadInput!) {
    deleteThread(input: $input) {
      ...ThreadFragment
    }
  }
`)

export const useDeleteThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteThreadResponse,
  Error,
  DeleteThreadInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteThreadResponse>(
        deleteThreadMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['threads'],
      })
      queryClient.invalidateQueries({
        queryKey: ['thread', variables.id],
      })
    },
  })
}
