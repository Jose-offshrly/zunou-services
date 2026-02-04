import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateThreadInput, Thread } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateThreadResponse {
  createThread: Thread
}

const CREATE_THREAD_MUTATION = graphql(/* GraphQL */ `
  mutation CreateThread($input: CreateThreadInput!) {
    createThread(input: $input) {
      id
      name
      type
      pulseId
    }
  }
`)

export const useCreateThreadMutation = ({
  coreUrl,
}: {
  coreUrl: string
}): UseMutationResult<CreateThreadResponse, Error, CreateThreadInput> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateThreadInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateThreadResponse>(
        CREATE_THREAD_MUTATION,
        { input },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['threads'],
      })
      queryClient.invalidateQueries({
        queryKey: [
          'thread',
          variables.pulseId,
          variables.organizationId,
          variables.type,
        ],
      })
    },
  })
}
