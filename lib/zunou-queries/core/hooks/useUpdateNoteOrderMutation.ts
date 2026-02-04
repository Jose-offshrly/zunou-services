import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Note, NoteOrderInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateNoteOrderResponse {
  updateNoteOrder: Note[]
}

const UPDATE_NOTE_ORDER_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateNoteOrder($input: [NoteOrderInput!]!) {
    updateNoteOrder(input: $input) {
      id
      title
      content
      labels {
        id
        name
        color
      }
      pinned
    }
  }
`)

export const useUpdateNoteOrderMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateNoteOrderResponse,
  Error,
  NoteOrderInput[]
> => {
  const { getToken } = useAuthContext()

  return useMutation({
    mutationFn: async (input: NoteOrderInput[]) => {
      const token = await getToken()

      const result = await gqlClient(
        coreUrl,
        token,
      ).request<UpdateNoteOrderResponse>(UPDATE_NOTE_ORDER_MUTATION, {
        input,
      })
      return result
    },
  })
}
