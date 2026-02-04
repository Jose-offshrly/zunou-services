import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { SavedMessage, SaveMessageInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface SavedMessageResponse {
  saveMessage: SavedMessage
}

const saveMessageMutationDocument = graphql(/* GraphQL */ `
  mutation saveMessage($input: SaveMessageInput!) {
    saveMessage(input: $input) {
      messageId
      userId
      data {
        id
        content
        role
        threadId
        userId
        organizationId
      }
      thread {
        pulse {
          name
        }
      }
    }
  }
`)

export const useSaveMessageMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  SavedMessageResponse,
  Error,
  SaveMessageInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SaveMessageInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<SavedMessageResponse>(
        saveMessageMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: ({ saveMessage }) => {
      const {
        data: { organizationId },
      } = saveMessage

      queryClient.invalidateQueries({
        queryKey: ['savedMessages'],
      })
      queryClient.invalidateQueries({
        queryKey: ['messages', organizationId],
      })
    },
  })
}
