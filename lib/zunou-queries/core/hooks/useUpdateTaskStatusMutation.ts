import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Task, UpdateTaskStatusInput } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface UpdateTaskStatusResponse {
  updateTaskStatus: Task
}

const updateTaskStatusMutationDocument = graphql(/* GraphQL */ `
  mutation UpdateTaskStatus($input: UpdateTaskStatusInput!) {
    updateTaskStatus(input: $input) {
      ...TaskFragment
    }
  }
`)

export const useUpdateTaskStatusMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  UpdateTaskStatusResponse,
  Error,
  UpdateTaskStatusInput
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateTaskStatusInput) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<UpdateTaskStatusResponse>(
        updateTaskStatusMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: ['tasks', input.taskId],
      })
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })
}
