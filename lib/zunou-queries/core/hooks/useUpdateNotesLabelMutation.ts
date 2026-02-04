import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Label, UpdateLabelInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateLabelResponse {
  updateLabel: Label
}

const UPDATE_LABEL_MUTATION = graphql(/* GraphQL */ `
  mutation UpdateLabel($input: UpdateLabelInput!) {
    updateLabel(input: $input) {
      id
      name
      color
    }
  }
`)

export const useUpdateNotesLabelMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateLabelResponse,
  Error,
  UpdateLabelInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateLabelInput) => {
      const token = await getToken()
      return gqlClient(coreUrl, token).request<UpdateLabelResponse>(
        UPDATE_LABEL_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['labels'],
      })
      // Also invalidate notes queries since labels are used in notes
      queryClient.invalidateQueries({
        queryKey: ['notes'],
      })
    },
  })
}
