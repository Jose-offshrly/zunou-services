import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreateLabelInput {
  name: string
  pulse_id: string
  color?: string
}

interface Label {
  id: string
  name: string
  color?: string
}

interface CreateLabelMutationResponse {
  createLabel: Label
}

const CREATE_LABEL_MUTATION = /* GraphQL */ `
  mutation CreateLabel($input: CreateLabelInput!) {
    createLabel(input: $input) {
      id
      name
      color
    }
  }
`

export const useCreateNotesLabelMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateLabelMutationResponse,
  Error,
  CreateLabelInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateLabelInput) => {
      const token = await getToken()
      return gqlClient(coreUrl, token).request<CreateLabelMutationResponse>(
        CREATE_LABEL_MUTATION,
        {
          input,
        },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['labels'],
      })
    },
  })
}
