import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  TaskStatusType,
  UpdatePulseTaskStatusInput,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdatePulseTaskStatusResponse {
  updatePulseTaskStatus: TaskStatusType
}

const updatePulseTaskStatusMutationDocument = graphql(/* GraphQL */ `
  mutation UpdatePulseTaskStatus($input: UpdatePulseTaskStatusInput!) {
    updatePulseTaskStatus(input: $input) {
      id
      pulse_id
      label
      color
      createdAt
      updatedAt
    }
  }
`)

export const useUpdatePulseTaskStatusMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdatePulseTaskStatusResponse,
  Error,
  UpdatePulseTaskStatusInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdatePulseTaskStatusInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdatePulseTaskStatusResponse>(
        updatePulseTaskStatusMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['taskStatuses', data.updatePulseTaskStatus.pulse_id],
      })
    },
  })
}
