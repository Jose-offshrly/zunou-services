import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface Label {
  id: string
  name: string
}

interface DeleteLabelResponse {
  deleteLabel: Label
}

const DELETE_LABEL_MUTATION = /* GraphQL */ `
  mutation DeleteLabel($id: ID!) {
    deleteLabel(id: $id) {
      id
      name
    }
  }
`

export const useDeleteNotesLabelMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteLabelResponse,
  Error,
  { id: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteLabelResponse>(
        DELETE_LABEL_MUTATION,
        {
          id,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['labels'],
      })
      queryClient.invalidateQueries({
        queryKey: ['label', variables.id],
      })
    },
  })
}
