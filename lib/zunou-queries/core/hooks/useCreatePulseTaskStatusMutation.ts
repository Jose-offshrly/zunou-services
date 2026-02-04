import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import {
  CreatePulseTaskStatusInput,
  TaskStatusType,
} from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface CreatePulseTaskStatusResponse {
  createPulseTaskStatus: TaskStatusType
}

const createPulseTaskStatusMutationDocument = graphql(/* GraphQL */ `
  mutation CreatePulseTaskStatus($input: CreatePulseTaskStatusInput!) {
    createPulseTaskStatus(input: $input) {
      id
      pulse_id
      label
      color
      position
      createdAt
      updatedAt
    }
  }
`)

export const useCreatePulseTaskStatusMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreatePulseTaskStatusResponse,
  Error,
  CreatePulseTaskStatusInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePulseTaskStatusInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreatePulseTaskStatusResponse>(
        createPulseTaskStatusMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['taskStatuses', variables.pulse_id],
      })
    },
  })
}
