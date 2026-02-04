import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { DeletePulseTaskStatusInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeletePulseTaskStatusResponse {
  deletePulseTaskStatus: boolean
}

const deletePulseTaskStatusMutationDocument = graphql(/* GraphQL */ `
  mutation DeletePulseTaskStatus($input: DeletePulseTaskStatusInput!) {
    deletePulseTaskStatus(input: $input)
  }
`)

export const useDeletePulseTaskStatusMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeletePulseTaskStatusResponse,
  Error,
  DeletePulseTaskStatusInput & { pulseId: string }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      input: DeletePulseTaskStatusInput & { pulseId: string },
    ) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeletePulseTaskStatusResponse>(
        deletePulseTaskStatusMutationDocument,
        {
          input: {
            id: input.id,
          },
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['taskStatuses', variables.pulseId],
      })
    },
  })
}
