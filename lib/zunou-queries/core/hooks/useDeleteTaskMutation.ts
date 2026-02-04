import type { UseMutationResult } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { graphql } from '@zunou-graphql/core/gql'
import { Task } from '@zunou-graphql/core/graphql'
import { gqlClient } from '@zunou-queries/helpers/gqlClient'
import type { MutationOptions } from '@zunou-queries/types/graphql'
import { useAuthContext } from '@zunou-react/contexts/AuthContext'

interface DeleteTaskResponse {
  deleteTask: Task
}

const deleteTaskMutationDocument = graphql(/* GraphQL */ `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) {
      ...TaskFragment
    }
  }
`)

export const useDeleteTaskMutation = ({
  coreUrl,
}: MutationOptions): UseMutationResult<
  DeleteTaskResponse,
  Error,
  {
    id: string
  }
> => {
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const token = await getToken()

      return gqlClient(coreUrl, token).request<DeleteTaskResponse>(
        deleteTaskMutationDocument,
        {
          id,
        },
      )
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ['tasks', variables.id],
      })

      await queryClient.invalidateQueries({
        queryKey: ['tasks'],
      })
    },
  })
}
