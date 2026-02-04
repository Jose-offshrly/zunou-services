import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Thread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateActiveThreadInput {
  threadId: string
}

interface UpdateActiveThreadResponse {
  updateActiveThread: Thread
}

const updateActiveThreadMutationDocument = graphql(/* GraphQL */ `
  mutation updateActiveThread($threadId: String!) {
    updateActiveThread(threadId: $threadId) {
      ...ThreadFragment
    }
  }
`)

export const useUpdateActiveThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateActiveThreadResponse,
  Error,
  UpdateActiveThreadInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ threadId }: UpdateActiveThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateActiveThreadResponse>(
        updateActiveThreadMutationDocument,
        {
          threadId,
        },
      )
    },
    onSuccess: ({ updateActiveThread }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'thread',
          updateActiveThread?.pulseId,
          updateActiveThread?.organizationId,
          updateActiveThread?.type,
        ],
      })
    },
  })
}
