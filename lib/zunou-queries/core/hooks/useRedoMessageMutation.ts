import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Message, RedoMessageInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface RedoMessageResponse {
  redoMessage: Message
}

const redoMessageMutationDocument = graphql(/* GraphQL */ `
  mutation redoMessage($input: RedoMessageInput!) {
    redoMessage(input: $input) {
      ...MessageFragment
    }
  }
`)

export const useRedoMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  RedoMessageResponse,
  Error,
  RedoMessageInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RedoMessageInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<RedoMessageResponse>(
        redoMessageMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: ({ redoMessage }) => {
      queryClient.invalidateQueries({
        queryKey: [
          'messages',
          redoMessage?.organizationId,
          redoMessage?.thread_id,
        ],
      })
    },
  })
}
