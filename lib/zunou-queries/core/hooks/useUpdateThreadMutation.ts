import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Thread, UpdateThreadInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateThreadResponse {
  thread: Thread
}

const updateThreadMutationDocument = graphql(/* GraphQL */ `
  mutation updateThread($input: UpdateThreadInput!) {
    updateThread(input: $input) {
      ...ThreadFragment
    }
  }
`)

export const useUpdateThreadMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateThreadResponse,
  Error,
  UpdateThreadInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateThreadResponse>(
        updateThreadMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['threads'],
      })
    },
  })
}
