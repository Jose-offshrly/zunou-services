import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { CreateTaskInput, Task } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'
import { ClientError } from 'graphql-request'

interface CreateTaskResponse {
  createTask: Task[]
}

const createTaskMutationDocument = graphql(/* GraphQL */ `
  mutation CreateTask($input: [CreateTaskInput!]!) {
    createTask(input: $input) {
      ...TaskFragment
    }
  }
`)

export const useCreateTaskMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  CreateTaskResponse,
  ClientError,
  CreateTaskInput[]
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput[]) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<CreateTaskResponse>(
        createTaskMutationDocument,
        {
          input,
        },
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })
}
